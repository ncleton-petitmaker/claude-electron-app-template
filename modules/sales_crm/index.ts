import manifest from "./module.config.json";
import type { ErpModuleManifest } from "../types";

export { SalesCrmAdminPanel } from "./SalesCrmAdminPanel";
export { SalesCrmServiceLauncher } from "./SalesCrmServiceLauncher";

export const salesCrmModule = manifest as ErpModuleManifest;
