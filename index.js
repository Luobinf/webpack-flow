const { AsyncSeriesHook } = require('tapable');

const beforeCompile = new AsyncSeriesHook(['params'])

const hooks = {
    beforeCompile,
}
Object.freeze(hooks)

// hooks.beforeCompile.tapAsync('beforeCompile', (name, callback) => {
//     console.log(name)
//     callback()
// })

hooks.beforeCompile.callAsync({
    name: 'beforeCompile',
}, (err => {
    console.log(err)
    console.log('====beforeCompile====')
}))


function fn() {

}

fn()
