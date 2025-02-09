import { useEffect } from 'react';
import { Alert } from '@/components/Alert';
import { toast } from 'react-hot-toast';
import { priorityToIcon } from '@/components/Icons';
import { PUBLIC_NEXTAUTH_URL } from '@/services/config';
import { notificationsTable } from '@/database/database.config';
import useAuthenticatedSocket from '@/hooks/useAuthenticatedSocket';
import { useSocketEvent } from 'socket.io-react-hook';

type ProcessTagsReturn = {
  otherTags: string[];
  openpro: Record<string, string>;
};

const processTags = (tags: any | undefined): ProcessTagsReturn => {
  if (!tags) return { otherTags: [], openpro: {} };

  const openpro = tags
    .filter((tag: string) => tag.startsWith('openpro.'))
    .reduce((obj: Record<string, string>, tag: string) => {
      const [key, value] = tag.replace('openpro.', '').split('=');
      obj[key] = value;
      return obj;
    }, {});

  const otherTags = tags.filter((tag: string) => !tag.startsWith('openpro.'));

  return { otherTags, openpro };
};

const Notifications = () => {
  const { socket, connected, error } = useAuthenticatedSocket();
  const { lastMessage: msg } = useSocketEvent(socket, 'message');

  useEffect(() => {
    if (msg && msg?.type === 'notification') {
      if (!msg.id && msg.messageId) msg.id = msg.messageId;
      msg.subscriptionId = `http://${PUBLIC_NEXTAUTH_URL}/${msg.topic}`;
      msg.new = 1;

      notificationsTable.add(msg).catch((error) => {
        if (
          !error.toString().includes('Key already exists in the object store.')
        ) {
          return Promise.reject(error);
        }

        // We return here because we do not want to toast the same message twice
        return;
      });

      const { otherTags, openpro } = processTags(msg?.tags);

      toast.success(
        JSON.stringify({
          title: msg?.title,
          message: msg?.message,
          tags: otherTags,
          priority: msg?.priority,
          click: msg?.click,
        }),
        {
          duration: openpro?.notificationDuration
            ? Number(openpro?.notificationDuration)
            : 10000,
          icon: priorityToIcon(msg?.priority),
        }
      );
    }
  }, [msg]);

  return <Alert />;
};

export default Notifications;
