#!/usr/bin/env node
import prompts from "prompts";
import { ensureFileSync } from "fs-extra";
import axios from "axios";
import JSZip from "jszip";
import path from "node:path";
import ora from "ora";
import fs from "node:fs";

async function init() {
  try {
    let answers = await prompts(
      [
        {
          name: "name",
          type: "text",
          message: "模板名称",
          initial: "my-app",
        },
        {
          name: "frame",
          type: "select",
          message: "使用什么框架开发",
          choices: (prev, answers) => [
            {
              title: "react",
              value: "react",
            },
            {
              title: "vue",
              value: "vue",
            },
          ],
        },
        {
          name: "build",
          type: "select",
          message: "使用什么构建工具开发",
          choices: (prev, answers) => {
            if (answers.frame === "react") {
              return [
                { title: "umi", value: "umi" },
                { title: "vite", value: "vite" },
              ];
            } else {
              return [{ title: "vite", value: "vite" }];
            }
          },
        },
        {
          name: "ui",
          type: "select",
          message: "使用什么ui组件库开发",
          choices: (prev, answers) => {
            if (answers.frame === "vue") {
              return [
                { title: "Element Plus", value: "Element Plus" },
                { title: "Ant Design Vue", value: "Ant Design Vue" },
              ];
            } else {
              return [
                {
                  title: "Ant Design",
                  value: "Ant Design",
                },
              ];
            }
          },
        },
      ]
      // {
      //   onCancel: () => {
      //     throw new Error(red("✖") + ` ${language.errors.operationCancelled}`);
      //   },
      // }
    );
    console.log("answers", answers);
    if (answers.name && answers.frame && answers.build && answers.ui) {
      const spinner = ora();
      spinner.start(`正在拉取模板`);
      const { name } = answers;
      const targetPaath = path.resolve(process.cwd(), `./${name}`);
      if (fs.existsSync(targetPaath)) {
        spinner.fail(`新建失败！${name}文件夹已经存在！`);
      } else {
        // 发起下载请求
        const response = await axios({
          url: "http://110.40.134.47:8080/package/download",
          data: { ...answers },
          method: "POST",
          responseType: "arraybuffer",
        });
        // 将 ArrayBuffer 数据转换为 Buffer
        const buffer = Buffer.from(response.data);
        const file = await JSZip.loadAsync(buffer);
        for (let relativePath of Object.keys(file.files)) {
          const file2 = file.files[relativePath];
          if (file2 && !file2.dir) {
            // 忽略目录
            const filePath = path.join(targetPaath, relativePath);
            const buffer2 = await file2.async("nodebuffer");
            ensureFileSync(filePath); // 确保文件路径存在
            fs.writeFileSync(filePath, buffer2); // 保存文件
          }
        }
        // 修改文件名
        const packagePath = path.join(targetPaath, "package.json");
        const data = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        data.name = answers.name;
        const modifiedData = JSON.stringify(data, null, 2);
        fs.writeFileSync(packagePath, modifiedData, "utf8");
        spinner.succeed(`模板拉取成功`);
      }
    }
  } catch (cancelled) {
    console.log(cancelled.message);
    process.exit(1);
  }
}

init().catch((e) => {
  console.error(e);
});
