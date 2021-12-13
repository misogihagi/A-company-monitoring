const { fork } = require("child_process");

function getSTDOut(child) {
  return new Promise((resolve, reject) => {
    let result = "";
    child.on("message", ({ data }) => {
      result += Buffer.from(data).toString();
    });
    child.on("exit", () => resolve(result));
  });
}

describe("exam1", () => {
  test("頂いたcsv", async () => {
    expect(
      await getSTDOut(
        fork("src/exam1.js", ["-p", "test/test.csv"], { silent: true })
      )
    ).toBe("");
  });

  test("test.csv", async () => {
    expect(
      await getSTDOut(
        fork("src/exam1.js", ["-p", "test/test1.csv"], { silent: true })
      )
    ).toBe(
      "サーバー10.20.30.1/16が復旧しました。故障期間は2020年1月2日3時4分5.000秒から2020年1月2日3時4分6.002秒までです。\n" +
        "サーバー10.20.30.1/16が復旧しました。故障期間は2020年1月2日3時4分9.000秒から2020年1月2日3時4分11.100秒までです。\n" +
        "サーバー10.20.30.2/16が復旧しました。故障期間は2020年1月2日3時4分7.000秒から2020年1月2日3時4分9.000秒までです。\n"
    );
  });
});
describe("exam2", () => {
  test("頂いたcsv", async () => {
    expect(
      await getSTDOut(
        fork("src/exam2.js", ["-p", "test/test.csv"], { silent: true })
      )
    ).toBe("");
  });

  test("test.csv with dafault count", async () => {
    expect(
      await getSTDOut(
        fork("src/exam2.js", ["-p", "test/test2.csv"], { silent: true })
      )
    ).toBe(
      "サーバー10.20.30.1/16が復旧しました。故障期間は2020年1月2日3時4分9.000秒から2020年1月2日3時4分12.100秒までです。\n"
    );
  });
  test("test.csv with specified count 2", async () => {
    expect(
      await getSTDOut(
        fork("src/exam2.js", ["-p", "test/test2.csv", "-N", "2"], {
          silent: true,
        })
      )
    ).toBe(
      "サーバー10.20.30.1/16が復旧しました。故障期間は2020年1月2日3時4分9.000秒から2020年1月2日3時4分12.100秒までです。\n" +
        "サーバー10.20.30.2/16が復旧しました。故障期間は2020年1月2日3時4分6.000秒から2020年1月2日3時4分9.000秒までです。\n"
    );
  });
  test("test.csv with specified count 5", async () => {
    expect(
      await getSTDOut(
        fork("src/exam2.js", ["-p", "test/test2.csv", "-N", "5"], {
          silent: true,
        })
      )
    ).toBe("");
  });
});
