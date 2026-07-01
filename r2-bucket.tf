terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = "cfat_JRVg9PFn4kicoD8Ph8r5TtnaPtCmDct7T0cN7406"
}

resource "cloudflare_r2_bucket" "randevu_images" {
  account_id = "c885d9b3bfb94036e6aa37d894548072"
  name       = "randevu-images"
  location   = "EEUR"
}
