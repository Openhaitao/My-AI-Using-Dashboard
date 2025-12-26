# 图标文件说明

此文件夹包含 Chrome 插件所需的三个尺寸的图标：

- ✅ `icon16.png` - 16x16 像素（工具栏显示）
- ✅ `icon48.png` - 48x48 像素（扩展管理页面）
- ✅ `icon128.png` - 128x128 像素（Chrome 网上应用店）

所有图标均已从 `MyAIMeter_Logo.png` 自动生成。

## 更新图标

如果需要更新图标，替换根目录的 `MyAIMeter_Logo.png` 后运行：

```bash
cd /Users/haitao/Desktop/MyAIMeter
sips -z 16 16 MyAIMeter_Logo.png --out icons/icon16.png
sips -z 48 48 MyAIMeter_Logo.png --out icons/icon48.png
sips -z 128 128 MyAIMeter_Logo.png --out icons/icon128.png
```
