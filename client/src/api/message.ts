import request from '@/utils/http';

const BASE = '/messages';

export function fetchMessagePage(params: {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  messageType?: string;
}) {
  return request.get<Api.Task.PageResult<any>>({
    url: BASE,
    params
  });
}

export function fetchUnreadMessageCount() {
  return request.get<number>({
    url: `${BASE}/unread-count`
  });
}

export function fetchMarkMessageRead(id: number) {
  return request.post<boolean>({
    url: `${BASE}/${id}/read`
  });
}

export function fetchMarkAllMessagesRead() {
  return request.post<number>({
    url: `${BASE}/read-all`
  });
}

