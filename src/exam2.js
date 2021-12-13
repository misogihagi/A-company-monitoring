const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const filepath = argv.p || "test/test.csv";
const timeoutCountMax = argv.N || 3;
const csvStr = require("fs").readFileSync(filepath).toString();

const stdout = [];

function formatDateStr(s) {
  return (
    s.slice(0, 4) +
    "-" +
    s.slice(4, 6) +
    "-" +
    s.slice(6, 8) +
    " " +
    s.slice(8, 10) +
    ":" +
    s.slice(10, 12) +
    ":" +
    s.slice(12, 14)
  );
}
function outputDateStr(d) {
  return (
    d.getFullYear() +
    "年" +
    (d.getMonth() + 1) +
    "月" +
    d.getDate() +
    "日" +
    d.getHours() +
    "時" +
    d.getMinutes() +
    "分" +
    d.getSeconds() +
    "." +
    d.getMilliseconds().toString().padStart(3, "0") +
    "秒"
  );
}

const csvArray = csvStr.split(require("os").EOL).map((s) => {
  const data = s.split(",");
  return {
    time: new Date(formatDateStr(data[0])),
    host: data[1],
    response: data[2],
  };
});
const dataGroupByHost = csvArray.reduce((acc, cur) => {
  if (acc[cur.host] === undefined) acc[cur.host] = [];
  acc[cur.host].push(cur);
  return acc;
}, {});

for (const host in dataGroupByHost) {
  function* Cursor() {
    yield* dataGroupByHost[host];
  }

  const cursor = Cursor();
  let next = cursor.next();
  let value = next.value;
  let done = next.done;
  let recordWhenBroken = value.response === "-" ? value : null;
  let timeoutCount = 0;

  while (!done) {
    if (value.response == "-") {
      if (timeoutCount === 0) {
        recordWhenBroken = value;
      }
      timeoutCount += 1;
    }
    if (
      recordWhenBroken &&
      value.response != "-" &&
      timeoutCount >= timeoutCountMax
    ) {
      const returnedDate = new Date(value.time);
      returnedDate.setMilliseconds(
        returnedDate.getMilliseconds() + value.response
      );
      stdout.push(
        `サーバー${value.host}が復旧しました。故障期間は${outputDateStr(
          recordWhenBroken.time
        )}から${outputDateStr(returnedDate)}までです。\n`
      );
      recordWhenBroken = null;
      timeoutCount = 0;
    }
    next = cursor.next();
    value = next.value;
    done = next.done;
  }
}

const stream = require("stream");
const ws = new stream.Writable();
ws._write = function (chunk, encoding, done) {
  process.send(chunk);
  done();
};

stream.Readable.from(stdout).pipe(process.send ? ws : process.stdout);
