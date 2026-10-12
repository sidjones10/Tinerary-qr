import "i18next"
import type common from "@/public/locales/en/common.json"

/**
 * Tell i18next about this app's namespaces and resource shape.
 *
 * Without this augmentation `t()` is typed as `unknown` under
 * react-i18next v16, so every translated string in JSX fails to typecheck.
 * `returnNull: false` matches the runtime init in lib/i18n.ts.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof common
    }
    returnNull: false
  }
}
