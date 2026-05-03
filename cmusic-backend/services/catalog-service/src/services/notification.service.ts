import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3010';

export class NotificationService {
  static async send(data: {
    recipientId: string;
    type: 'FOLLOW' | 'COMMENT_TAG' | 'REPLY' | 'NEW_RELEASE' | 'SYSTEM';
    title: string;
    message: string;
    link?: string;
    senderId?: string;
    data?: any;
  }) {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, data);
    } catch (error: any) {
      console.error('[NotificationService Error]:', error.message);
    }
  }

  static async notifyCommentTag(recipientId: string, senderName: string, trackTitle: string, trackId: string) {
    return this.send({
      recipientId,
      type: 'COMMENT_TAG',
      title: 'Bạn được nhắc tên!',
      message: `${senderName} đã nhắc đến bạn trong một bình luận ở bài hát "${trackTitle}"`,
      link: `/track/${trackId}`,
      data: { trackId }
    });
  }

  static async notifyReply(recipientId: string, senderName: string, trackTitle: string, trackId: string) {
    return this.send({
      recipientId,
      type: 'REPLY',
      title: 'Có phản hồi mới!',
      message: `${senderName} đã phản hồi bình luận của bạn trong bài hát "${trackTitle}"`,
      link: `/track/${trackId}`,
      data: { trackId }
    });
  }

  static async notifyFollow(recipientId: string, followerName: string, followerId: string) {
    return this.send({
      recipientId,
      type: 'FOLLOW',
      title: 'Người theo dõi mới!',
      message: `${followerName} đã bắt đầu theo dõi bạn.`,
      link: `/artist/${recipientId}`, // Giả định recipient là artist
      senderId: followerId
    });
  }
}
