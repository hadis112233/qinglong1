const { execSync } = require('child_process');
const { sendNotify } = require('./notify.js');
require(`./env.js`);

function initGlobal() {
  global.QLAPI = {
    notify: sendNotify,
  };
}

function expandRange(rangeStr, max) {
  const tempRangeStr = rangeStr
    .trim()
    .replace(/-max/g, `-${max}`)
    .replace(/max-/g, `${max}-`);

  return tempRangeStr.split(' ').flatMap((part) => {
    const rangeMatch = part.match(/^(\d+)([-~_])(\d+)$/);
    if (rangeMatch) {
      const [, start, , end] = rangeMatch.map(Number);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    return Number(part);
  });
}

function run() {
  try {
    // TODO: big size
    const splitStr = '__sitecustomize__';
    let command = `bash -c "source ${process.env.taskBefore} ${process.env.fileName}`;
    if (process.env.task_before) {
      command = `${command} && echo -e '执行前置命令\n' && eval "${process.env.task_before}" && echo -e '\n执行前置命令结束\n'`;
    }
    const res = execSync(
      `${command} && echo "${splitStr}" && NODE_OPTIONS= node -p 'JSON.stringify(process.env)'"`,
      {
        encoding: 'utf-8',
      },
    );
    const [output, envStr] = res.split(splitStr);
    const newEnvObject = JSON.parse(envStr.trim());
    for (const key in newEnvObject) {
      process.env[key] = newEnvObject[key];
    }
    console.log(output);
  } catch (error) {
    console.log(`run task before error: `, error.message);
  }

  const { envParam, numParam } = process.env;
  if (envParam && numParam) {
    const array = (process.env[envParam] || '').split('&');
    const runArr = expandRange(numParam, array.length);
    const arrayRun = runArr.map((i) => array[i - 1]);
    const envStr = arrayRun.join('&');
    process.env[envParam] = envStr;
  }
}

initGlobal();
run();
