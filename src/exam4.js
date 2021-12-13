const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const filepath = argv.p || "test/test.csv";
const timeoutCountMax = argv.N || 3;
const responseCount = argv.m || 5;
const responseAvg = argv.t || 100;

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

function addressToInt(s) {
  return parseInt(
    s
      .split("/")[0]
      .split(".")
      .map((e) => parseInt(e).toString(2).padStart(8, 0))
      .join(""),
    2
  );
}
function subnetOf(addr) {
  const prefixLength = parseInt(addr.split("/")[1]);
  const binaryAddr =
    addressToInt(addr).toString(2).padStart(32, 0).slice(0, prefixLength) +
    "0".repeat(32 - prefixLength);
  return (
    [
      [0, 8],
      [8, 16],
      [16, 24],
      [24, 32],
    ]
      .map((a) => parseInt(binaryAddr.slice(a[0], a[1]), 2))
      .join(".") +
    "/" +
    prefixLength
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
const serverList = csvArray.reduce((acc, cur) => {
  if (!acc.includes(cur.host)) acc.push(cur.host);
  return acc;
}, []);

const dataGroupByHost = csvArray.reduce((acc, cur) => {
  if (acc[cur.host] === undefined) acc[cur.host] = [];
  acc[cur.host].push(cur);
  return acc;
}, {});

const malfunctionLog = [];

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
      malfunctionLog.push({
        host: value.host,
        subnet: subnetOf(value.host),
        from: recordWhenBroken.time,
        to: returnedDate,
      });
      recordWhenBroken = null;
      timeoutCount = 0;
    }
    next = cursor.next();
    value = next.value;
    done = next.done;
  }
  const sum = dataGroupByHost[host]
    .slice(-1 * responseCount)
    .filter((e) => e.response != "-")
    .reduce((sum, val) => sum + Number(val.response), 0);
  const count = dataGroupByHost[host]
    .slice(-1 * responseCount)
    .filter((e) => e.response != "-").length;
  const avg = sum / count;
  if (avg > responseAvg) {
    stdout.push(
      `サーバー${host}は過負荷状態です。期間は${outputDateStr(
        dataGroupByHost[host].slice(-1 * responseCount)[0].time
      )}からです。\n`
    );
  }
}

const subnets = serverList.reduce((acc, cur) => {
  const subnet = subnetOf(cur);
  if (!acc[subnet]) acc[subnet] = [];
  acc[subnet].push(cur);
  return acc;
}, {});

for (const subnet in subnets) {
  if (subnets[subnet].every((e) => malfunctionLog.some((d) => d.host === e)))
    stdout.push(
      `サブネット${subnet}が故障しています。故障期間は${outputDateStr(
        new Date(
          Math.max(
            ...malfunctionLog
              .filter((e) => e.subnet === subnet)
              .map((e) => e.from.getTime())
          )
        )
      )}から${outputDateStr(
        new Date(
          Math.min(
            ...malfunctionLog
              .filter((e) => e.subnet === subnet)
              .map((e) => e.to.getTime())
          )
        )
      )}までです。\n`
    );
}

const stream = require("stream");
const ws = new stream.Writable();
ws._write = function (chunk, encoding, done) {
  process.send(chunk);
  done();
};

stream.Readable.from(stdout).pipe(process.send ? ws : process.stdout);
