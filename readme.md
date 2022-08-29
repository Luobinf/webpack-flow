1、compiler.run()方法

finalCallback、onCompiled、run

会调用run（）方法，触发 beforeRun 异步串形钩子，参数为 compiler。

```JS
this.hooks = {
    /** @type {AsyncSeriesHook<[Compiler]>} */
	beforeRun: new AsyncSeriesHook(["compiler"]),
}
const run = () => {
    this.hooks.beforeRun.callAsync(this, err => {
        if (err) return finalCallback(err);

        this.hooks.run.callAsync(this, err => {
            if (err) return finalCallback(err);

            this.readRecords(err => {
                if (err) return finalCallback(err);

                this.compile(onCompiled);  ✅
            });
        });
    });
};
```


```JS
compilation.finish(err => {
    logger.timeEnd("finish compilation");
    if (err) return callback(err);

    logger.time("seal compilation");
    compilation.seal(err => {
        logger.timeEnd("seal compilation");
        if (err) return callback(err);

        logger.time("afterCompile hook");
        this.hooks.afterCompile.callAsync(compilation, err => {
            logger.timeEnd("afterCompile hook");
            if (err) return callback(err);

            return callback(null, compilation);
        });
    });
});
```

compilation.finish => compilation.seal



2、


## webpack 中的异步任务调度执行

AsyncQueue.js


