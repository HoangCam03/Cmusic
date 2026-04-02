import nodemailer from 'nodemailer';

// Cấu hình transporter Gmail với App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, otp: string): Promise<void> => {
  // Tách 6 chữ số thành mảng để render từng ô trong email
  const digits = otp.split('');

  const digitBoxStyle = `
    display: inline-block;
    width: 44px;
    height: 52px;
    line-height: 52px;
    text-align: center;
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    background: linear-gradient(135deg, rgba(255,0,128,0.2), rgba(178,0,255,0.2));
    border: 1.5px solid rgba(255,0,128,0.5);
    border-radius: 10px;
    margin: 0 4px;
    letter-spacing: 0;
  `;

  const mailOptions = {
    from: '"CMusic" <no-reply@cmusic.com>',
    to: email,
    subject: '🎵 Mã xác thực tài khoản CMusic của bạn',
    html: `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0; padding:0; background-color:#050002; font-family: 'Arial', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050002; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px; background:#0A0008; border-radius:24px; border:1px solid rgba(255,0,128,0.25); overflow:hidden; box-shadow: 0 0 60px rgba(255,0,128,0.1);">
              
              <!-- Top Glow Line -->
              <tr>
                <td style="height:3px; background: linear-gradient(90deg, transparent, #FF0080 30%, #B200FF 70%, transparent); padding:0;"></td>
              </tr>

              <!-- Header / Logo -->
              <tr>
                <td align="center" style="padding: 36px 40px 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#FF0080,#B200FF); display:inline-flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,0,128,0.5);">
                          <span style="font-size:24px;">🎵</span>
                        </div>
                      </td>
                      <td style="padding-left:12px; vertical-align:middle;">
                        <div style="font-size:26px; font-weight:900; color:#ffffff; letter-spacing:-0.5px; line-height:1;">CMusic</div>
                        <div style="font-size:9px; font-weight:700; color:#FF0080; letter-spacing:0.3em; text-transform:uppercase; margin-top:3px;">PREMIUM</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 0 40px 40px; text-align: center;">
                  <h1 style="margin:0 0 8px; font-size:22px; font-weight:900; color:#ffffff;">Xác thực tài khoản</h1>
                  <p style="margin:0 0 28px; font-size:14px; color:#9CA3AF; line-height:1.6;">
                    Chào mừng bạn đến với CMusic! Đây là mã OTP để xác thực tài khoản của bạn.<br/>
                    Mã có hiệu lực trong <strong style="color:#FF0080;">5 phút</strong>.
                  </p>

                  <!-- OTP Box -->
                  <div style="margin: 0 0 28px; padding: 24px 20px; background: rgba(255,0,128,0.05); border-radius:16px; border: 1px solid rgba(255,0,128,0.15);">
                    <p style="margin:0 0 16px; font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase; letter-spacing:0.2em;">Mã xác thực của bạn</p>
                    <div>
                      ${digits.map(d => `<span style="${digitBoxStyle}">${d}</span>`).join('')}
                    </div>
                    <p style="margin:16px 0 0; font-size:11px; color:#4B5563;">Nhập mã này vào ô xác thực trên trình duyệt</p>
                  </div>

                  <!-- Warning -->
                  <div style="padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); margin-bottom:24px;">
                    <p style="margin:0; font-size:12px; color:#6B7280; line-height:1.6;">
                      ⚠️ Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.<br/>
                      Không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên CMusic.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px; border-top:1px solid rgba(255,255,255,0.05); text-align:center;">
                  <p style="margin:0; font-size:11px; color:#374151;">
                    © 2026 CMusic. Trải nghiệm âm nhạc không giới hạn.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP [${otp}] đã được gửi tới: ${email}`);
  } catch (error) {
    console.error('Lỗi gửi mail:', error);
    throw new Error('Không thể gửi email xác thực. Vui lòng thử lại sau.');
  }
};
