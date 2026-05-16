# quanliang
开启全量与主动

## 安装教程
在yunzai根目录下使用
```
git clone https://github.com/wind-trace/quanliang.git ./plugins/kaiquanliang
```

## 使用教程
1.首先要准备一个napcat野鸡，注意，如果野鸡`连在官机同一个鸡上`，则不用修改其他，如果`没有在同一个鸡上`，需要在napcat的`网络配置`中新增一个http服务器，名称自定义，host填`127.0.0.1`如果有其他需要可以填其他，port填`3000`（可改成其他，但是需要看后面`注意事项`），Token填`napcat_uin_to_uid`,然后保存启用。
2.在群聊中艾特官机发送`开全量 群号`，然后根据提示开启（如果官机和野鸡在同个群聊里，则只需要艾特官机发送`开全量`，然后点击野鸡发送的链接即可）
## 注意事项
如果是使用http服务器的方法，一定要填入正确配置，如果填入的我给的值，则直接使用即可，如果自定义了任何值，则需要打开插件然后参考注释修改对应的内容
```
NAPCAT_HTTP_HOST = '127.0.0.1' // napcat开启的http服务器host
NAPCAT_HTTP_PORT = 3000 // napcat开启的http服务器端口
NAPCAT_AUTH_TOKEN = 'napcat_uin_to_uid' // napcat鉴权token
```
