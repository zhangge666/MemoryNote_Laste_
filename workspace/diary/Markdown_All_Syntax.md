# Markdown 全语法示例（GFM 兼容）

---

## 1. 标题（ATX）1111

# H1 标题
## H2 标题
### H3 标题
#### H4 标题
##### H5 标题
###### H6 标题

备用（闭合井号）：
### 闭合形式 ###

---

## 2. 段落与换行

这是一个段落。末尾两个空格  
产生换行。

空行分隔段落。

---

## 3. 强调/斜体/删除线/粗斜体

- 普通：这是文本
- 斜体：*italic* 或 _italic_
- 粗体：**bold** 或 __bold__
- 删除线：~~strikethrough~~
- 粗斜体：***bold italic***

---

## 4. 行内代码与代码块

行内代码：`const a = 1`。

缩进代码块（不推荐）：
    console.log('indent block')

围栏代码块（推荐）：
```js
function sum(a, b) {
  return a + b
}
```

语言标注（高亮）：
```ts
export type User = { id: string; name: string }
```

波浪线围栏：
~~~python
print('hello via ~~~ fence')
~~~

---

## 5. 链接与图片

- 行内链接：[访问网站](https://example.com)
- 带标题链接：[带标题](https://example.com "title")
- 参考式链接：[参考 A][ref-a] 与 [参考 B][ref-b]

[ref-a]: https://example.com/a "A 标题"
[ref-b]: https://example.com/b

- 自动链接（GFM）：https://github.com

图片（行内与参考）：

![示例图片](https://via.placeholder.com/120x60 "占位图")

![参考图片][img-ref]

[img-ref]: https://via.placeholder.com/160x90 "占位图2"

---

## 6. 列表（有序/无序/任务）

无序列表（- * + 均可）：
- 苹果
- 香蕉
  - 嵌套项 1
  - 嵌套项 2
* 橙子
+ 葡萄

有序列表（数字+点/括号）：
1. 第一步
2. 第二步
   1. 子步骤 2.1
   2. 子步骤 2.2

任务列表（GFM）：
- [ ] 未完成任务
- [x] 已完成任务
- [ ] 另一个任务

---

## 7. 引用（>）

> 引用段落
>
> 多行引用
>
>> 嵌套引用

---

## 8. 水平分割线（hr）

三条或以上：

---
***
___

---

## 9. 表格（GFM）

| 字段 | 类型 | 说明 |
|:----:|:----:|:-----|
| id   | int  | 主键 |
| name | text | 名称 |

对齐演示：

| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|------:|
| left   | mid  | right |

---

## 10. 转义字符

\* 不是斜体，\_ 不是斜体，\# 不是标题。

反斜杠可转义：\\ \* \_ \# \( \) \[ \] \{ \} \` \!

---

## 11. 脚注（GFM 扩展）

这是一个脚注示例[^1]，以及第二个脚注[^long].

[^1]: 这里是脚注内容。
[^long]: 多行脚注内容。
    第二行。

---

## 12. 定义列表（部分解析器支持）

术语一
: 定义内容 1

术语二
: 定义内容 2
: 另一条解释

---

## 13. 内联/块级 HTML（根据渲染器设置）

<span style="color: #e11d48;">内联 HTML</span>

<div style="border:1px solid #ddd;padding:8px;">
  块级 HTML 容器
</div>

> 安全提示：在多数应用中 HTML 渲染会受限或被关闭。

---

## 14. 引用式图片/链接标题转义示例

[链接含括号](https://example.com/foo_(bar))

![图示含括号](https://via.placeholder.com/80x40 "foo_(bar)")

---

## 15. Front Matter（YAML，部分工具识别）

```yaml
---
title: Markdown 全语法示例
author: you
categories:
  - demo
  - syntax
---
```

---

## 16. 数学公式（渲染器支持 KaTeX/MathJax 时生效）

行内公式示例：$E = mc^2$。

块级公式：

$$
\int_{-\infty}^{+\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

> 默认 Markdown 并不内置数学，需额外插件/渲染器。

---

## 17. 综合示例

> **标题**：*综合* 示例  
> 参考：[GitHub 文档][gh-docs] 与 ![Logo][img-ref]

[gh-docs]: https://docs.github.com/

---

## 18. 锚点与目录（取决于渲染器）

- [回到标题 1](#1-标题atx)
- [回到表格](#9-表格gfm)

---

## 19. 混合中文/英文与编码测试

这是中文段落 mixed with English words to test UTF-8.

> 结尾：祝使用顺利！
