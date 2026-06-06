package com.example.importorder.event;

/**
 * Published whenever a PurchaseOrder transitions into SENT — either via
 * the explicit DRAFT→SENT state-machine call ({@code PurchaseOrderServiceImpl#sendPO})
 * or via the batch-creation shortcut that writes status=SENT directly
 * ({@code ProcessRequestServiceImpl#createPOBatch}).
 *
 * <p>{@code siteId} / {@code siteName} are required for per-site addressing
 * in {@link com.example.importorder.listener.PONotificationListener#onPOSent}.
 * The notification system uses {@code siteId} so only the target Site's users
 * see the bell-icon update — not every SITE user across countries.
 */
public record POSentEvent(Integer poId, String poCode, Integer siteId, String siteName) {}
