import typescript from "@rollup/plugin-typescript";

export default [{
  input: ['./src/client/client.ts'],
  output: [{
    dir: 'exports',
    format: 'es'
  }],
  plugins: [
    typescript()
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