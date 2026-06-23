/** ArtEmpty 占位插画 variant，需与 `src/assets/icons/empty/*.svg` 文件名（不含扩展名）一致 */

export const ArtEmptyVariant = {
  NO_MESSAGE: 'no_message',
  NO_FOLLOW: 'no_follow',
  UNDER_CONSTRUCTION: 'under_construction',
  NO_LOCATION: 'no_location',
  NO_NETWORK: 'no_network',
  NO_DATA: 'no_data',
  NO_PERMISSION: 'no_permission',
  NO_INFO: 'no_info',
  FAVORITES_EMPTY: 'favorites_empty',
  NO_ORDERS: 'no_orders',
  SEARCH_NO_RESULTS: 'search_no_results',
  ERROR_404: 'error_404'
} as const;

export type ArtEmptyVariantType = (typeof ArtEmptyVariant)[keyof typeof ArtEmptyVariant];
