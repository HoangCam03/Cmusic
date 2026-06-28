import { Request, Response } from 'express';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import { ZALOPAY_CONFIG, PAYMENT_CONFIG } from '../config';
import { Transaction, Subscription } from '@spotify/libs/database';

export const paymentController = {
  createOrder: async (req: Request, res: Response) => {
    try {
      const { userId, planId, amount } = req.body;

      const embed_data = JSON.stringify({ redirecturl: "http://localhost:5173/payment-success" });
      const item = JSON.stringify([{ planId, amount }]);
      const transID = Math.floor(Math.random() * 1000000);
      const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;
      
      const order: any = {
        app_id: parseInt(ZALOPAY_CONFIG.app_id),
        app_trans_id: app_trans_id,
        app_user: userId.toString(),
        app_time: Date.now(),
        item: item,
        embed_data: embed_data,
        amount: parseInt(amount),
        description: `Thanh toan goi ${planId}`,
        bank_code: "", // Vẫn nên để trống trong môi trường test
      };

      // MAC format: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
      const data = ZALOPAY_CONFIG.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
      order.mac = CryptoJS.HmacSHA256(data, ZALOPAY_CONFIG.key1).toString();

      console.log("\n========== ZALOPAY DEBUG ==========");
      console.log("1. Data string to hash:", data);
      console.log("2. Generated MAC:", order.mac);
      console.log("3. Final Order Payload:", JSON.stringify(order, null, 2));
      console.log("===================================\n");

      const response = await axios.post(ZALOPAY_CONFIG.endpoint, order, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("[ZALOPAY RESPONSE]", response.data);
      
      if (response.data.return_code === 1) {
        // Lưu giao dịch vào DB với trạng thái pending
        await Transaction.create({
          userId,
          appTransId: order.app_trans_id,
          amount,
          planId,
          status: 'pending'
        });
      }

      return res.status(200).json({
        ...response.data,
        app_trans_id: order.app_trans_id
      });
    } catch (error: any) {
      console.error("Create order error:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  callback: async (req: Request, res: Response) => {
    let result: any = {};

    try {
      const { data: dataStr, mac } = req.body;
      const checkMac = CryptoJS.HmacSHA256(dataStr, ZALOPAY_CONFIG.key2).toString();

      if (mac !== checkMac) {
        result.return_code = -1;
        result.return_message = "mac not equal";
      } else {
        const dataJson = JSON.parse(dataStr);
        const appTransId = dataJson["app_trans_id"];

        // Cập nhật Transaction thành công
        const transaction = await Transaction.findOneAndUpdate(
          { appTransId },
          { status: 'success', zpTransId: dataJson["zp_trans_id"] },
          { new: true }
        );

        if (transaction) {
          // Cập nhật hoặc tạo mới Subscription cho User
          const durationMonths = 1; // Mặc định 1 tháng, có thể tùy chỉnh theo planId
          const endDate = moment().add(durationMonths, 'months').toDate();

          await Subscription.findOneAndUpdate(
            { userId: transaction.userId },
            { 
              planId: transaction.planId as any,
              status: 'active',
              startDate: new Date(),
              endDate: endDate
            },
            { upsert: true, new: true }
          );

          const { User } = require('@spotify/libs/database');
          await User.findByIdAndUpdate(
            transaction.userId,
            { plan: transaction.planId }
          );
          
          console.log(`Payment Success for User: ${transaction.userId}, Plan: ${transaction.planId}`);
        }

        result.return_code = 1;
        result.return_message = "success";
      }
    } catch (error: any) {
      result.return_code = 0;
      result.return_message = error.message;
    }

    res.json(result);
  },

  getOrderStatus: async (req: Request, res: Response) => {
    try {
      const { appTransId } = req.params;
      let transaction = await Transaction.findOne({ appTransId });

      if (!transaction) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Nếu đơn hàng vẫn đang chờ, hãy chủ động hỏi ZaloPay
      if (transaction.status === 'pending') {
        const data = ZALOPAY_CONFIG.app_id + "|" + appTransId + "|" + ZALOPAY_CONFIG.key1;
        const mac = CryptoJS.HmacSHA256(data, ZALOPAY_CONFIG.key1).toString();

        const response = await axios.post(ZALOPAY_CONFIG.query_endpoint, null, {
          params: {
            app_id: ZALOPAY_CONFIG.app_id,
            app_trans_id: appTransId,
            mac: mac
          }
        });

        if (response.data.return_code === 1) {
          // ZaloPay xác nhận thành công -> Cập nhật DB của mình
          transaction.status = 'success';
          transaction.zpTransId = response.data.zp_trans_id;
          await transaction.save();

          // Nâng cấp Premium cho User
          const durationMonths = 1;
          const endDate = moment().add(durationMonths, 'months').toDate();

          await Subscription.findOneAndUpdate(
            { userId: transaction.userId },
            { 
              planId: transaction.planId as any,
              status: 'active',
              startDate: new Date(),
              endDate: endDate
            },
            { upsert: true, new: true }
          );

          // Cập nhật thuộc tính plan vào User để Frontend nhận diện được
          const { User } = require('@spotify/libs/database');
          await User.findByIdAndUpdate(
            transaction.userId,
            { plan: transaction.planId }
          );
          
          console.log(`[QUERY] Payment Success updated for User: ${transaction.userId}`);
        }
      }

      return res.status(200).json({ 
        status: transaction.status,
        planId: transaction.planId 
      });
    } catch (error: any) {
      console.error("Query order error:", error);
      return res.status(500).json({ message: error.message });
    }
  }
};
