import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import builtins from "rollup-plugin-node-builtins";
import modify from "rollup-plugin-modify";
import { readFile } from 'fs/promises'
const p2pt = await readFile('./node_modules/@leofcoin/p2pt/exports/browser/p2pt.umd.js')
export default [{
  input: ['./src/client/client.ts'],
  output: [{
    dir: 'exports',
    format: 'es'
  }],
  plugins: [
    typescript({
      compilerOptions: {
        declaration: true,
        outDir: 'exports'
      }
    })
  ]
}, {
  input: ['./src/client/client.ts'],
  output: [{
    dir: 'exports/browser',
    format: 'es',
    name: 'P2PTSwarm'
  }],
  external: [
    '@koush/wrtc'
  ],
  plugins: [
    builtins(),
    
    modify({
      "import P2PT from '@leofcoin/p2pt'": p2pt.toString()
    }),
    nodeResolve({
      preferBuiltins: false,
      mainFields: ['browser', 'module', 'main']
    }),
    commonjs(),
    typescript({
      compilerOptions: {
        outDir: 'exports/browser'
      }
    })
  ]
}, {
  input: ['./src/server/server.ts'],
  output: [{
    dir: 'exports',
    format: 'es'
  }],
  plugins: [
    typescript()
  ]
}]