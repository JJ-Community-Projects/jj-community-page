import fs from "fs";
import os from "os";

function setEnvValue(key, value) {
  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS = fs.readFileSync('./.env', 'utf8').split(os.EOL)

  // find the env we want based on the key
  const target = ENV_VARS.indexOf(
    ENV_VARS.find(line => {
      return line.match(new RegExp(key))
    }),
  )

  // replace the key/value with the new value
  ENV_VARS.splice(target, 1, `${key}=${value}`)

  // write everything back to the file system
  fs.writeFileSync('./.env', ENV_VARS.join(os.EOL))
}

setEnvValue('VITE_BUILD_DATE', new Date().toISOString())
