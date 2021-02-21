#use GOOGLE_APPLICATION_CREDENTIALS environment variable for credentials JSON
provider "google-beta" {
  project = "qaware-techradar"
  region  = "europe-west1"
}

provider "google" {
  project = "qaware-techradar"
  region  = "europe-west1"
}

resource "google_cloudbuild_trigger" "github-trigger" {
  name = "techradar-github-trigger"
  provider = google-beta
  filename = "cloudbuild.yaml"
  github {
    owner = "qaware"
    name   = "build-your-own-radar"
    push {
    	branch = "master"
    }
  }
}

resource "google_storage_bucket" "static-site" {
  name          = "techradar-versiondata"
  location      = "EU"
  force_destroy = true
  project = "qaware-techradar"
}






