// Generated using webpack-cli https://github.com/webpack/webpack-cli

const fs = require("fs");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("@effortlessmotion/html-webpack-inline-source-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const isProduction = process.env.NODE_ENV == "production";
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

//class ReplaceTextPlugin {
//  apply(compiler) {
//    compiler.hooks.afterEmit.tap("ReplaceTextPlugin", (compilation) => {
//      const outputPath = compiler.options.output.path;
//      let indexHtml = fs.readFileSync(
//        path.join(outputPath, "index.html"),
//        "utf8"
//      );
//      indexHtml = indexHtml.replace("{{", "{ {");
//      fs.writeFileSync(path.join(outputPath, "index.html"), indexHtml, "utf8");
//    });
//  }
//}

const stylesHandler = "style-loader";

const config = {
  entry: {
    //worker: './src/interpolationWorker.ts',
    main: "./src/index.ts",
  },
  target: 'webworker', // Specify the target as webworker for worker bundle
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: '/',
		//	workerPublicPath: '/workers/',

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

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: isProduction ? "index.html" : "index-dev.html",
      inlineSource: ".(js|css)$", // Inline all js and css files
      minify: true,
    }),
    // Plugin to inline JavaScript bundle into HTML
    // Fixes a little something about litHTML "{{" conflicting in anki template
    //new ReplaceTextPlugin(),
    //new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/main/]),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  optimization: {
    minimize: true, // Minimize JavaScript
    minimizer: [
      new TerserPlugin({
                terserOptions: {
mangle: {
                        keep_classnames: true,
}}
      }),
      new CssMinimizerPlugin(), // Add this line for CSS minification
      //new HtmlMinimizerPlugin(), // Add this line for HTML minification
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
    devtool: "source-map",

  devServer: {
    open: true,
    host: "localhost",
  }
    //    // Other dev server options...
    //    headers: {
    //        'Access-Control-Allow-Origin': '*',
    //        'Content-Type': 'application/javascript', // Set the content type for TypeScript files
    //    },
    //},
};

if (isProduction) {
  config.plugins.push(new HtmlWebpackInlineSourcePlugin())
}

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
    config.devServer.static= {
      directory: path.join(__dirname, 'static'), // Serve other static files from the 'public' directory
    };
  }
  return config;
};
