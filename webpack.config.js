// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("@effortlessmotion/html-webpack-inline-source-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const isProduction = process.env.NODE_ENV == "production";
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
//const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

const stylesHandler = "style-loader";

const config = {
  entry: {
    _morphWorker: './src/morph/getMorphs.worker.ts',
    main: "./src/index.ts",
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, "dist"),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"],
      },
      {
        test: /\.(eot|ttf|woff|woff2|svg|png|jpg|gif)$/i,
        type: "asset/inline",
      },
    ],
  },
  optimization: {
    minimize: true, // Minimize JavaScript
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: {
            keep_classnames: true,
          }
        }
      }),
      new CssMinimizerPlugin(),
      //new HtmlMinimizerPlugin(),
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devtool: "source-map",
  devServer: {
    open: true,
    host: "localhost",
  },
  plugins: isProduction ?  [
    new HtmlWebpackPlugin({
      inject: true,
      template: "index.html",
      inlineSource: "^(?!.*_morphWorker\\.js$).*(js|css)$", // Inline all js and css files
      minify: true,
    }),
    new HtmlWebpackInlineSourcePlugin()
  ] : [
    new HtmlWebpackPlugin({
      template: "index-dev.html",
    })
  ]
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
    config.devServer.static = {
      directory: path.join(__dirname, 'static'), // Serve other static files from the 'public' directory
    };
  }
  return config;
};
