// Rollup plugins
// import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
const path = require('path');

const product = process.env.NODE_ENV.trim() === 'prd';
// const sourceMap = !product;
const FILEMANE = pkg.name;
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n  */`;
const external = ['maptalks'];
const globals = {
    maptalks: 'maptalks'
};

const plugins = [
    json(),
    nodeResolve(),
    commonjs()
    // babel({
    //     // exclude: ['node_modules/**']
    // })
];

function getEntry() {
    return path.join(__dirname, './index.js');
}

let output = [
    {
        input: getEntry(),
        external: external,
        plugins: plugins,
        output: {
            format: 'umd',
            name: 'maptalks',
            file: `dist/${FILEMANE}.js`,
            sourcemap: true,
            extend: true,
            banner: banner,
            globals
        }
    },
    {
        input: getEntry(),
        external: external,
        plugins: plugins,
        output: {
            sourcemap: false,
            format: 'es',
            // banner,
            file: `dist/${FILEMANE}.es.js`,
            extend: true,
            banner: banner,
            globals
        }
    },
    {
        input: getEntry(),
        external: external,
        plugins: plugins.concat([terser()]),
        output: {
            format: 'umd',
            name: 'maptalks',
            file: `dist/${FILEMANE}.min.js`,
            sourcemap: false,
            extend: true,
            banner: banner,
            globals
        }
    }
];
if (!product) {
    output = output.slice(0, 1);
}
export default output;
