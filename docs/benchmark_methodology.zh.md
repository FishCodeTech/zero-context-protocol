# Benchmark 方法论

ZCP 的 benchmark 结论应当可以直接从 Python SDK 仓库复现，而不是在文档站里手工维护。

## 唯一事实来源

只使用 `zero-context-protocol-python` 中的 benchmark harness：

- script: `examples/compare_zcp_mcp_tool_call_benchmark.py`
- script（Excel 语义套件）: `examples/compare_excel_client_protocol_benchmark.py`
- harness: `tools/benchmarking.py`
- harness（Excel 语义套件）: `tools/excel_llm_benchmarking.py`
- report outputs:
  - `benchmark_reports/zcp_mcp_tool_call_benchmark.json`
  - `benchmark_reports/zcp_mcp_tool_call_benchmark.md`
  - `benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.json`
  - `benchmark_reports/full_semantic_compare_v5/excel_llm_token_benchmark.md`
  - `benchmark_reports/full_semantic_compare_v5/semantic_benchmark_summary.md`

文档站应当消费这些生成产物，而不是重新实现 runner 逻辑。

## 必需的报告字段

每一条 benchmark 结论都应包含：

- run 日期
- model 和 provider
- repeat 次数
- task set 描述
- prompt 构造规则
- 是否包含完整 MCP schema 注入
- token 统计来源
- failure 处理规则

## 复现方式

在 `zero-context-protocol-python` 中执行：

```bash
python3 examples/compare_zcp_mcp_tool_call_benchmark.py --repeats 2
```

对于当前发布的 Excel 语义对比（`full_semantic_compare_v5`）：

```bash
python3 examples/compare_excel_client_protocol_benchmark.py \
  --model deepseek-chat \
  --repeats 1 \
  --tiers A,B,C,D \
  --backends zcp_client_to_native_zcp,mcp_client_to_zcp_mcp_surface \
  --output-dir benchmark_reports/full_semantic_compare_v5
```

## 解读规则

- 比较的是协议开销，而不是模型整体智能水平
- model、provider 和 run 日期必须明确写出，因为 benchmark 数字会随时间漂移
- 应以生成的 JSON 和 markdown 报告作为可发布证据
- docs-site 中的图表和表格只应承担展示作用

## 为什么 ZCP 可能更优

预期的效率收益来自：

- 更紧凑的 registry 交换
- schema out-of-band 设计
- 基于 handle 的大结果存储
- 以增量披露约束替代反复传递完整 schema
- 将面向 task 的运行时状态保留在 transcript 之外

任何关于 token 节省的结论，都应配套给出用于该比较的确切 benchmark 生成产物。

## 最新发布结果（full_semantic_compare_v5）

发布口径：

- run 日期：`2026-03-17`
- model/provider：`deepseek-chat` on `https://api.deepseek.com`
- repeats：`1`
- case 数：`37`
- 对比后端：
  - native：`zcp_client_to_native_zcp`
  - MCP surface：`mcp_client_to_zcp_mcp_surface`

| Scope | Native ZCP Avg Total | MCP Surface Avg Total | Token Delta (MCP - Native) | Ratio |
| --- | ---: | ---: | ---: | ---: |
| Overall | 8027.9 | 30723.7 | 22695.8 | 3.83x |
| Tier A | 15979.4 | 17613.2 | 1633.8 | 1.10x |
| Tier B | 1826.6 | 29239.4 | 27412.8 | 16.01x |
| Tier C | 2091.1 | 72113.9 | 70022.7 | 34.49x |
| Tier D | 2018.3 | 19375.7 | 17357.3 | 9.60x |

本次运行中 native ZCP 的质量汇总：

- answer accuracy：`100.0%`
- workbook accuracy：`97.3%`
- tool compliance：`100.0%`

边界说明：

- 该报告是单次运行快照（`repeats=1`），不是方差研究
- `37` 个 case 中，native ZCP 在 `25` 个 case token 更低；剩余 `12` 个全部属于 Tier A 原子操作
