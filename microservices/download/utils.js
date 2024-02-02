const https = require("node:https");
const TOKEN = process.env.GH_TOKEN_DOWNLOAD_MICROSERVICE;

// Environment Variables Check

if (typeof TOKEN === "undefined") {
  if (process.env.PULSAR_STATUS !== "dev") {
    // We are not in dev mode. Our auth token is gone, and the application may fail to work
    // due to rate limiting by GitHub for unauthenticated API requests.
    console.log("Missing Required Environment Variables! Something has gone wrong!");
    process.exit(1);
  }
}

function doRequest() {

  const options = {
    hostname: 'api.github.com',
    path: '/repos/pulsar-edit/pulsar-rolling-releases/releases',
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'pulsar-edit/package-frontend/microservices/download',
      'Authorization': `Bearer ${TOKEN}`
    }
  };

  if (process.env.PULSAR_STATUS === "dev") {
    // We don't expect to be authed in dev mode.
    // Fetching releases from GitHub without authentication is fine in dev mode.
    delete options.headers['Authorization'];
  }

  return new Promise((resolve, reject) => {
    let data = '';

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // No more data in response.
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};

function query_os(providedParams) {
  if (typeof providedParams !== "string") {
    return false;
  }

  const valid = [ "linux", "arm_linux", "silicon_mac", "intel_mac", "windows" ];
  const allParams = providedParams.split("&");

  for (const param of allParams) {
    if (param.startsWith("os=")) {
      // Returning a result based on the first "os=" param we encounter.
      // Users should not provide the same param twice, that would be invalid.
      const prov = param.split("=")[1];
      return valid.includes(prov) ? prov : false;
    }
  }

  // No "os" query param was provided, return false
  return false;
}

function query_type(providedParams) {
  if (typeof providedParams !== "string") {
    return false;
  }

  const valid = [
    "linux_appimage",
    "linux_tar",
    "linux_rpm",
    "linux_deb",
    "windows_setup",
    "windows_portable",
    "windows_blockmap",
    "mac_zip",
    "mac_zip_blockmap",
    "mac_dmg",
    "mac_dmg_blockmap"
  ];
  const allParams = providedParams.split("&");

  for (const param of allParams) {
    if (param.startsWith("type=")) {
      // Returning a result based on the first "type=" param we encounter.
      // Users should not provide the same param twice, that would be invalid.
      const prov = param.split("=")[1];
      return valid.includes(prov) ? prov : false;
    }
  }

  // No "type" query param was provided, return false
  return false;
}

async function displayError(req, res, errMsg) {
  if (errMsg.code && errMsg.msg) {

    res.writeHead(errMsg.code, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: errMsg.msg }));
    res.end();

  } else {
    // Default Error Handler
    res.writeHead(500, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Server Error" }));
    res.end();
  }
}

async function findLink(os, type) {
  try {

    let releases = await doRequest();

    if (!Array.isArray(releases)) {
      console.error("GitHub Returned invalid data on release request!");
      console.error(releases);

      return {
        ok: false,
        code: 500,
        msg: "Request to GitHub for releases failed."
      };
    }

    // Now these releases should be sorted already, if we find they aren't we might
    // have to add semver as a dep on this microservice, which is no fun since this
    // microservice has 0 deps currently. For now lets assume it's a sorted array
    // This same assumption is made on the `pulsar-updater` core package

    for (const version of releases) {
      for (const asset of version.assets) {

        let name = asset.name;

        let returnObj = {
          ok: true,
          content: asset?.browser_download_url
        };

        // Ensure we have valid data to work with
        if (typeof name !== "string" || typeof returnObj.content !== "string") {
          continue;
        }

        if (os === "windows") {
          if (
            type === "windows_setup" &&
            name.startsWith("Pulsar.Setup") &&
            name.endsWith(".exe")
          ) {

            return returnObj;

          } else if (
            type === "windows_portable" &&
            name.endsWith("-win.zip")
          ) {

            return returnObj;

          } else if (
            type === "windows_blockmap" &&
            name.startsWith("Pulsar.Setup") &&
            name.endsWith(".exe.blockmap")
          ) {

            return returnObj;

          }
        } else if (os === "silicon_mac") {
          if (
            type === "mac_zip" &&
            name.endsWith("-arm64-mac.zip")
          ) {

            return returnObj;

          } else if (
            type === "mac_zip_blockmap" &&
            name.endsWith("-arm64-mac.zip.blockmap")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg" &&
            name.endsWith("-arm64.dmg")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg_blockmap" &&
            name.endsWith("-arm64.dmg.blockmap")
          ) {

            return returnObj;

          }
        } else if (os === "intel_mac") {
          if (
            type === "mac_zip" &&
            name.endsWith("-mac.zip") &&
            !name.endsWith("-arm64-mac.zip")
          ) {

            return returnObj;

          } else if (
            type === "mac_zip_blockmap" &&
            name.endsWith("-mac.zip.blockmap") &&
            !name.endsWith("-arm64-mac.zip.blockmap")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg" &&
            name.endsWith(".dmg") &&
            !name.endsWith("-arm64.dmg")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg_blockmap" &&
            name.endsWith(".dmg.blockmap") &&
            !name.endsWith("-arm64.dmg.blockmap")
          ) {

            return returnObj;

          }
        } else if (os === "arm_linux") {
          if (
            type === "linux_appimage" &&
            name.endsWith("-arm64.AppImage")
          ) {

            return returnObj;

          } else if (
            type === "linux_tar" &&
            name.endsWith("-arm64.tar.gz")
          ) {

            return returnObj;

          } else if (
            type === "linux_rpm" &&
            name.endsWith(".aarch64.rpm")
          ) {

            return returnObj;

          } else if (
            type === "linux_deb" &&
            name.endsWith("_arm64.deb")
          ) {

            return returnObj;

          }
        } else if (os === "linux") {
          if (
            type === "linux_appimage" &&
            name.endsWith(".AppImage") &&
            !name.endsWith("-arm64.AppImage")
          ) {

            return returnObj;

          } else if (
            type === "linux_tar" &&
            name.endsWith(".tar.gz") &&
            !name.endsWith("-arm64.tar.gz")
          ) {

            return returnObj;

          } else if (
            type === "linux_rpm" &&
            name.endsWith(".x86_64.rpm")
          ) {

            return returnObj;

          } else if (
            type === "linux_deb" &&
            name.endsWith("_amd64.deb")
          ) {

            return returnObj;

          }
        }

      }
    }

    // If we get to this point it means the above loop didn't return.
    // Meaning we couldn't find a single valid asset among any versions
    // So we will return an error

    return {
      ok: false,
      code: 404,
      msg: `Unable to find any assets matching the provided parameters: os=${os};type=${type}`
    };

  } catch(err) {
    console.log(err);
    return {
      ok: false,
      code: 505,
      msg: "Server Error"
    };
  }
}

module.exports = {
  query_os,
  query_type,
  displayError,
  findLink,
};
