# インストール方法
npmとnodeをインストールして
```
git clone https://github.com/misogihagi/A-company-monitoring.git
cd A-company-monitoring
npm i
```

# 実行の仕方
設問1の場合
```
node src/exam1.js
```
設問2の場合
```
node src/exam2.js
```
設問3の場合
```
node src/exam3.js
```
設問4の場合
```
node src/exam4.js
```

# 実行オプション
実行時にオプションをつけることができます。
-p 使用するログファイルを指定します。デフォルトはtest/test.csvです。
-N N回以上連続してタイムアウトした場合にのみ故障とみなします。デフォルトは3です。
-m/-t 直近m回の平均応答時間がtミリ秒を超えた場合は、過負荷状態とみなします。デフォルトはそれぞれ5,100です。
例
使用するログファイルを/var/log/access.log,5回以上連続してタイムアウトした場合のみ故障とし直近10回の平均応答時間が1000ミリ秒を超えた場合を、過負荷状態とみなす場合は
```
node src/exam4.js -p test/test4.csv -N 5 -m 10 -t 1000
```

# テスト
```
npm run test
```
これで自動テストが走ります。

# 仕様
故障期間はpingを投げた時から最初に応答するまでにしています。
もしログがタイムアウトしたまま終わったらそこは故障期間に含まれていません。
サーバーごとに出力します。
