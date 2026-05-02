# ying-ya-rebirth.github.io

本仓库使用 Hugo 搭建个人博客；右侧菜单或博客首页可以看到各种自定义模块，包括图片图库。

## 图库 (Gallery)

图库渲染是通过浏览器端的 JavaScript 读取 GitHub 仓库中的 `gallery/index.json` 文件实现的。

默认情况下图库仓库就是当前博客仓库；如果你改为使用一个独立的公开仓库，
只需在 `hugo.toml` 里调整相应字段。

```toml
[params]
  galleryRepoOwner = "ying-ya-rebirth"        # GitHub 用户或组织
  galleryRepoName  = "ying-ya-rebirth.github.io"  # 仓库名
  galleryRepoBranch= "main"                   # 分支
  galleryPath      = "gallery"               # 在仓库中的路径
  galleryIndexFile = "index.json"            # 索引文件名
  galleryEnabled   = true                     # 是否在用户主页显示
```

只要将图片上传到目标仓库（博客仓库或单独的图库仓库）的 `gallery/`
目录并提供一个符合格式的 `index.json` 文件，前端就会自动加载并呈现画廊。
JSON 文件可手写，也可以在图库仓库里运行你自己的生成脚本——博客
仓库内已移除了原来的脚本。

若后续需要同步到其它仓库，只需调整 `hugo.toml` 中的 `galleryRepo*` 值。

---
