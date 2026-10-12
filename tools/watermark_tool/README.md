# 净图：纯前端图片去水印工具

这是一个基于 HTML/CSS/JavaScript + OpenCV.js 的纯前端工具，不调用 AI，不向任何服务器上传图片。它使用用户绘制的修复蒙版，调用 OpenCV `inpaint` 的 Telea 或 Navier–Stokes 传统图像修复算法。已接入 [工具箱首页](../../index.html)（分类：图片处理）。

## 运行

1. 用现代桌面浏览器通过 HTTP 访问 `index.html`（例如 `python -m http.server 8080` 后打开 `http://localhost:8080/tools/watermark_tool/`）。
2. 页面打开后会**自动在后台预加载修复引擎**（右下角有"修复引擎加载中/已就绪"状态指示），引擎只在首次使用时下载约 10 MB，之后浏览器缓存。
3. 导入 PNG、JPG、WebP 或 BMP 图片，在需要修复的区域涂抹，调节算法、半径和蒙版扩展，点击"开始修复"。
4. 用对比滑块检查结果，导出 PNG 或 JPG；顶部"返回首页"可回到工具箱。

## 架构要点

- **修复引擎运行在 Web Worker 中**（`index.html` 内嵌 Worker 脚本）：OpenCV.js 的下载、WASM 编译与 `inpaint` 计算全部在后台线程完成，主线程（界面）永不冻结。主线程与 Worker 之间通过 Transferable `ArrayBuffer` 传递图像数据，零拷贝开销。
- **双 CDN 源**：Worker 内优先从 docs.opencv.org 加载，失败自动切换 jsDelivr（@techstark/opencv-js，已确认包含 photo/inpaint 模块）；90 秒看门狗超时自动重建 Worker 重试，加载阶段（启动/下载/编译）在状态芯片实时可见。
- **掩膜包围盒裁剪**：只对水印包围盒 + 边距的小块区域执行 `inpaint`，再贴回原图，耗时随水印大小而非整图大小增长（17.5 MP 大图修小水印约 2.6s，900×600 约 0.2~0.3s）。
- **大图降采样兜底**：裁剪区域仍超 400 万像素时先降采样修复（`INTER_AREA`），再沿膨胀掩膜回贴。
- 画布层叠：原图 → 修复结果（对比裁剪）→ 半透明标记叠加 → 指针交互层；导出始终输出全分辨率，掩膜外像素与原图逐像素一致。
- 注意：Worker 内不要声明名为 `cv` 的全局变量，也不要对 OpenCV 的 Module 对象做任何 `await`/`.then` 交互（它是病态 thenable，会导致 Worker 死锁）；就绪检测只做 `setTimeout` 轮询 `self.cv.Mat`。

## 重要限制

- 首次使用需联网加载 OpenCV.js；离线部署时建议把 opencv.js 与页面一起静态托管，并修改 Worker `SOURCES` 中的地址。
- 算法是传统修复，不是语义理解。它不能保证还原被水印遮挡的真实内容；对大面积、脸部、文字、复杂建筑和高频纹理，可能出现模糊或错误纹理。
- 仅处理自己拥有或获准修改的图片。不要移除用于表明版权、作者或来源的标识，除非你有相应权限。

## 文档

详细方案参阅 [`DESIGN.md`](./DESIGN.md)。
