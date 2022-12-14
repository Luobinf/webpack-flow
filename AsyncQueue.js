class ArrayQueue {
  constructor(items) {
    this._list = items ? Array.from(items) : [];
  }
  // 入队
  enqueue(item) {
    this._list.push(item);
  }
  // 出队
  dequeue() {
    return this._list.shift();
  }
}

const QUEUED_STATE = 0;
const PROCESSING_STATE = 1;
const DONE_STATE = 2;

/**
 * @template T
 * @template K
 * @template R
 */
// Task
class AsyncQueueEntry {
  /**
   * @param {T} item the item
   * @param {Callback<R>} callback the callback
   */
  constructor(item, callback) {
    this.item = item;
    /** @type {typeof QUEUED_STATE | typeof PROCESSING_STATE | typeof DONE_STATE} */
    this.state = QUEUED_STATE;
    this.callback = callback;
    /** @type {Callback<R>[] | undefined} */
    this.callbacks = undefined;
    this.result = undefined;
    /** @type {WebpackError | undefined} */
    this.error = undefined;
  }
}

class AsyncQueue {
  constructor(options) {
    this.options = options;
    // 名称
    this.name = options.name;
    // 处理器函数
    this.processor = options.processor;
    // 并发执行最大数
    this.parallelism = options.parallelism || 100;
    // 唯一标示函数
    this.getKey = options.getKey;

    // 保存当前队列中即将需要执行的任务
    this._queued = new ArrayQueue();
    // 保存当前队列中所有已经执行过的任务
    this._entries = new Map();
    // 当前并发任务
    this._activeTasks = 0;
    // 是否开启下次事件队列EventLoop中等待执行的函数
    this._willEnsureProcessing = false;
    // 判断当前队列是否被暂停
    this._stopped = false;
    this._ensureProcessing = this._ensureProcessing.bind(this);
  }

  _ensureProcessing() {
    while (this._activeTasks < this.parallelism) {
      const entry = this._queued.dequeue();
      if (entry === undefined) break;
      this._activeTasks++;
      entry.state = PROCESSING_STATE;
      this._startProcess(entry);
      // 重置本次EventLoop中的_willEnsureProcessing为false
      this._willEnsureProcessing = false;
    }
  }

  _startProcess(entry) {
    this.processor(entry.item, (e, r) => {
      if (e) {
        this._handleResult(
          entry,
          new Error(`AsyncQueue(${this.name} processor error.)`)
        );
        return;
      }
      this._handleResult(entry, e, r);
    });
  }

  // 当Task处理完成时, 调用任务的回调函数
  _handleResult(entry, err, result) {
    const callback = entry.callback;
    const callbacks = entry.callbacks;
    entry.state = DONE_STATE;
    entry.callback = undefined;
    entry.callbacks = undefined;
    entry.result = result;
    entry.error = err;
    this._activeTasks--;
    // 当调度器执行完成任务
    // 如果下一次EventLoop中并没有安排调度器执行
    // 那么重置this._willEnsureProcessing状态 开启调度器执行
    if (!this._willEnsureProcessing) {
      this._willEnsureProcessing = true;
      setImmediate(this._ensureProcessing);
    }
    callback(err, result);
    if (callbacks !== undefined) {
      for (const callback of callbacks) {
        callback(err, result);
      }
    }
  }

  add(item, callback) {
    if (this._stopped) {
      return callback(new Error(`Queue was stopped`));
    }

    const key = this.getKey(item);
    const entry = this._entries.get(key);

    if (entry !== undefined) {
      if (entry.state === DONE_STATE) {
        process.nextTick(() => callback(entry.error, entry.result));
      } else if (entry.callbacks === undefined) {
        entry.callbacks = [callback];
      } else {
        entry.callbacks.push(callback);
      }
      return;
    }
    const newEntry = new AsyncQueueEntry(item, callback);
    // 保存任务
    this._entries.set(key, newEntry);
    // Task 任务入队
    this._queued.enqueue(newEntry);

    if (this._willEnsureProcessing === false) {
      this._willEnsureProcessing = true;
      setImmediate(this._ensureProcessing);
    }
  }
}

const processDependencies = new AsyncQueue({
  name: "processDependencies",
  parallelism: 2,
  processor: _processModuleDependencies,
  getKey: (item) => item.key,
});

processDependencies.add(
  {
    key: 1,
    name: "item1",
  },
  (err, result) => {
    console.log("item1处理后的结果", err, result);
  }
);

processDependencies.add(
  {
    key: 2,
    name: "item2",
  },
  (err, result) => {
    console.log("item2处理后的结果", err, result);
  }
);

processDependencies.add(
  {
    key: 3,
    name: "item3",
  },
  (err, result) => {
    console.log("item3处理后的结果", err, result);
  }
);

// 此时我添加了一个重复的 key 为 item1 的任务
processDependencies.add({ key: 1, name: "item4" }, (err, result) => {
  console.log("item1重复处理后的结果", err, result);
});

// 此时我添加了一个重复的 key 为 item1 的任务
processDependencies.add({ key: 4, name: "item4" }, (err, result) => {
  console.log("item1重复处理后的结果", err, result);
});

// 此时我添加了一个重复的 key 为 item1 的任务
processDependencies.add({ key: 5, name: "item4" }, (err, result) => {
  console.log("item1重复处理后的结果", err, result);
});
function _processModuleDependencies(item, callback) {
  //   setTimeout(() => {
  //     item.number = Math.random();
  //     callback(null, item);
  //   }, 2000);
  item.number = Math.random();
  callback(null, item);
}






// webpack 中的异步任务调度执行


const IN_QUEUE = 0
const PROCESSING = 1
const DONE = 2

class AsyncQueueEntry2 {
  constructor(item,callback) {
    this.item = item;
    this.callback = callback;
    this.state = IN_QUEUE
  }
}

class ArrayQueue2 {
  constructor() {
    this.queue = []
  }
  enqueue(item) {
    this.queue.push(item)
  }
  dequeue() {
    return this.queue.shift()
  }
}


class AsyncQueue2 {
  constructor({ name, parallelism, processor, getKey }) {
    this._name = name
    this._parallelism = parallelism || 1
    // 当前任务索引
    this._activeTasks = 0
    this._processor = processor
    this._getKey = getKey || ( item => item )
    // 保存带执行的任务到队列中
    this._queue = new ArrayQueue2()
    this._needProcessing = false
    this._willEnsureProcessing = false
    this._ensureProcessing = this._ensureProcessing.bind(this)
  }

  add(item, callback) {

    const newEntry = new AsyncQueueEntry2(item, callback)
    this._queue.enqueue(newEntry)
    this._needProcessing = true
    if(this._willEnsureProcessing === false) {
      this._willEnsureProcessing = true
      setImmediate(this._ensureProcessing)
    }
  }

  _ensureProcessing() {
    while(this._activeTasks < this.parallelism) {
      const entry = this._queue.dequeue()
      if(entry === undefined) break
      this._activeTasks++
      entry.state = PROCESSING
      this._startProcess(entry)
    }

  }

  _startProcess(entry) {
    try {
      this._processor(entry.item, (e, r) => {
        this._handleResult(entry, e, r)
      })
    } catch (e) {
      this._handleResult(entry, e, null)
    }
  }

  _handleResult(entry, err, result) {
    const callback = entry.callback
    entry.state = DONE
    entry.callback = undefined
    entry.error = err

    this._activeTasks--
    
  }
}

const addModuleQueue = new AsyncQueue2({
  name: 'addModule',
  processor: function _addModule(item, callback) {  // 调度任务的处理方法
    callback(null, item)
  }
})


// 每一个任务进入调度器之后，都要经过调度器的处理器函数处理之后得到结果。

// xx.add(item, callback)

// Task1 
addModuleQueue.add({
  key: 1,
  name: 'Task1',
}, (err, result) => {
  console.log("Task1", err, result);
})

// Task2
addModuleQueue.add({
  key: 1,
  name: 'Task2',
}, (err, result) => {
  console.log("Task2", err, result);
})

// 当前任务状态？队列中、处理中、处理完毕






