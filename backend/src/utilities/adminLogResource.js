import { BaseProperty, BaseResource } from "adminjs";
const auditLogger = require("winston");

// Winston adapter to log actions for @adminjs/logger to console rather than db
export class WinstonAdapter extends BaseResource {
  //... all abstract methods from BaseResource
  name() {
    // auditLogger.info("Name");
    return "Log";
  }
  id() {
    // auditLogger.info("ID");
    return "Log";
  }
  create(params) {
    auditLogger.info(
      `Admin #${params.adminId} performed action ${params.action} on ${params.recordTitle} in ${params.resource}. Difference: ${params.difference}`
    );
    return;
  }
  properties() {
    auditLogger.info("Properties");
    return [
      new BaseProperty({ path: "id" }),
      new BaseProperty({ path: "recordId" }),
      new BaseProperty({ path: "recordTitle" }),
      new BaseProperty({ path: "difference" }),
      new BaseProperty({ path: "user" }),
      new BaseProperty({ path: "action" }),
      new BaseProperty({ path: "resource" }),
      new BaseProperty({ path: "createdAt" }),
      new BaseProperty({ path: "updatedAt" }),
    ];
  }
}
