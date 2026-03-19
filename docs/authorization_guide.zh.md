# 授权指南

本文说明 ZCP 如何保护兼容 MCP 的端点与原生端点、会暴露哪些与 OAuth 相关的路由，以及作用域（scope）如何在运行时中生效。

## 授权模式

ZCP 目前支持两种实用的授权模式：

- 静态 Bearer Token 保护
- OAuth 2.1 风格的授权码流程，支持 PKCE、刷新令牌、动态注册与吊销

这两种模式都可以保护面向 MCP 的传输层，以及原生的 `/zcp` 路径。

## 为什么授权是一等关注点

一个 ZCP 或 MCP 服务器可能会暴露高影响操作：

- 文件系统访问
- 租户数据
- 管理类操作
- 联网后端
- 长时间运行的工作流

授权必须附着在运行时边界上，而不是作为客户端侧约定事后补上。

## 静态 Bearer Token 模式

对于受控环境，最简单的选项是固定 Bearer Token。

```python
from zcp import BearerAuthConfig, ZCPServerConfig, create_asgi_app

application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        auth=BearerAuthConfig(token="replace-me"),
    ),
)
```

这种模式适用于：

- 本地开发
- 单租户内部服务
- 边界较窄的服务到服务部署

在更大规模的环境里，它不能替代完整的身份系统。

## 端到端模式：私有内部服务

对于调用方在网络边界上已经被信任的内部服务，Bearer 鉴权通常就足够了。

典型形态：

1. 用一个 Bearer Token 保护 `/zcp`、`/mcp` 和 `/ws`
2. 仅在确有需要时让 `/healthz`、`/readyz` 和 `/metadata` 保持公开
3. 对高影响工具依然使用 `required_scopes`
4. 通过你现有的密钥管理流程轮换 Bearer Token

这种模式最适合：

- 私有 Agent 平台
- 内部自动化服务
- 需要与生产路由保持一致的预发布环境

## OAuth 支持

启用 OAuth 后，ZCP 可以暴露：

- 授权服务器元数据
- 面向 MCP 资源面的受保护资源元数据
- 授权端点
- Token 端点
- 动态客户端注册端点
- Token 吊销端点

相关配置通过 `ZCPServerConfig` 上的 `OAuthConfig` 提供。

## 端到端 OAuth 服务器示例

如果你需要持久化的 OAuth 状态以及带 scope 保护的能力面，这是一个最小但现实的服务器配置。

```python
from zcp import (
    AuthProfile,
    FastZCP,
    OAuthConfig,
    SQLiteOAuthProvider,
    ZCPServerConfig,
    create_asgi_app,
)

app = FastZCP(
    "Protected Weather",
    auth_profile=AuthProfile(
        issuer="https://zcp.example.com",
        authorization_url="https://zcp.example.com/authorize",
        token_url="https://zcp.example.com/token",
        scopes=["weather.read", "weather.admin"],
    ),
)


@app.tool(
    name="weather.lookup",
    description="Read weather data.",
    input_schema={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
        "additionalProperties": False,
    },
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.read",),
)
def weather_lookup(city: str):
    return {"city": city, "temperature": 24}


@app.tool(
    name="weather.rotate_cache",
    description="Administrative cache rotation.",
    input_schema={"type": "object", "properties": {}, "additionalProperties": False},
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("weather.admin",),
)
def rotate_cache():
    return {"status": "rotated"}


application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        oauth=OAuthConfig(enabled=True, issuer="https://zcp.example.com"),
        oauth_provider=SQLiteOAuthProvider("oauth.sqlite3"),
    ),
)
```

这套配置会直接给你：

- 发现元数据
- 授权码加 PKCE
- 刷新令牌支持
- 若已启用则支持动态客户端注册
- 吊销支持
- 使用 SQLite 持久化的 token 与 code 状态

## 带 PKCE 的授权码流程

当前 OAuth 流程支持：

1. 元数据发现
2. 授权码签发
3. PKCE verifier/challenge 校验
4. 访问令牌签发
5. 刷新令牌签发
6. 刷新令牌交换
7. Token 吊销

对于需要用户授权访问、而不是共享静态密钥的浏览器相关客户端和其他客户端，这就是正确的基础能力。

## 动态客户端注册

当配置启用时，动态注册可用。这样客户端可以获得：

- `client_id`
- `client_secret`
- 已注册的重定向 URI

这对以下场景很有用：

- 开发工具
- 测试工具链
- 不希望写死预配信息的嵌入式客户端

## Provider 模型

OAuth 状态不再局限于单进程内存。运行时目前支持：

- `InMemoryOAuthProvider`
- `SQLiteOAuthProvider`
- 以及面向其他后端存储的 Provider 抽象

### 内存 Provider

适合：

- 测试
- 临时本地开发
- 单进程实验

### SQLite Provider

适合：

- 需要持久化的本地安装
- 单节点部署
- 希望获得持久授权状态、但又不想额外引入独立服务的环境

示例：

```python
from zcp import OAuthConfig, SQLiteOAuthProvider, ZCPServerConfig, create_asgi_app

application = create_asgi_app(
    app,
    config=ZCPServerConfig(
        oauth=OAuthConfig(enabled=True, issuer="https://zcp.example.com"),
        oauth_provider=SQLiteOAuthProvider("zcp-oauth.db"),
    ),
)
```

## 授权码加 PKCE 的请求时序

当前已实现的时序如下：

1. `GET /.well-known/oauth-authorization-server`
2. `GET /authorize?...response_type=code&client_id=...&redirect_uri=...&code_challenge=...`
3. 收到带有 `code=...` 的重定向
4. `POST /token`，携带 `grant_type=authorization_code`、`code`、`client_id`、`redirect_uri` 和 `code_verifier`
5. 收到 `access_token` 和 `refresh_token`
6. 需要续期时，再次以 `grant_type=refresh_token` 调用 `POST /token`
7. 使用返回的 Bearer Token 调用 `/mcp`、`/ws` 或 `/zcp`

这套时序已经在本地测试中被覆盖。当前剩余的缺口是更广泛的客户端互操作覆盖，而不是服务器端基础路由流程本身。

## 端到端模式：托管 OAuth 部署

典型的托管部署流程如下：

1. 从 ASGI 服务公开 OAuth 元数据
2. 动态注册客户端，或提前完成客户端预配
3. 让浏览器端或面向用户的客户端走授权码加 PKCE
4. 为长会话签发刷新令牌
5. 使用 `SQLiteOAuthProvider` 或其他 Provider 持久化授权状态
6. 在运行时对工具、资源与提示词强制执行作用域

这样可以把授权行为绑定在服务器边界上，而不是分散到各个客户端中。

## 作用域强制执行

运行时会对以下对象执行作用域检查：

- 工具
- 资源
- 提示词

这意味着策略贴近执行面，而不是依赖客户端“自觉”。

服务端作用域声明示例：

```python
@app.tool(
    name="admin.rotate_key",
    description="Rotate a tenant signing key.",
    input_schema={"type": "object", "properties": {"tenant": {"type": "string"}}, "required": ["tenant"]},
    output_mode="scalar",
    inline_ok=True,
    required_scopes=("admin.keys",),
)
def rotate_key(tenant: str):
    return {"tenant": tenant, "status": "rotated"}
```

一个实际可行的 scope 拆分通常类似于：

- 面向读取的工具和资源：`*.read`
- 高影响变更：`*.admin` 或 `*.write`
- 租户级操作：与租户或角色边界对应的 scope

## 端到端模式：租户隔离的管理面

一个表现良好的生产模式通常是：

1. 广泛发放普通读取 scope
2. 保持管理类 scope 狭窄且可审计
3. 只把管理 scope 挂到少量工具或提示词上
4. 对高风险的长时任务要求走 tasks，这样取消状态可以保持可见

相比把租户与策略检查零散地嵌进每个工具处理函数里，这种方式的安全模型清晰得多。

## 公开路由与受保护路由

典型公开路由包括：

- `/`
- `/docs`
- `/healthz`
- `/readyz`
- `/metadata`
- 启用后的 OAuth 发现与 Token 路由

典型受保护路由通常包括：

- `/zcp`
- `/mcp`
- `/ws`

不要只根据路由名推断它是公开还是受保护。真正定义边界的是服务器配置。

## 部署建议

在以下情况下使用静态 Bearer 鉴权：

- 环境是受控的
- 所有客户端都已被信任
- 操作简洁性值得这种取舍

在以下情况下使用 OAuth：

- 客户端需要委托式用户授权
- Token 生命周期管理很重要
- 刷新行为很重要
- 集成边界已经超出单一受信进程

## 推荐部署模式

### 内部单租户服务

- 静态 Bearer Token 通常就足够
- 除非确实需要委托式用户访问，否则保持 OAuth 关闭

### 托管 MCP 服务

- 启用 OAuth
- 使用 SQLite 或你自己的 Provider 持久化授权状态
- 对每个可变更能力显式声明 scope

### 桌面端或工具集成

- 先从 Bearer 鉴权或本地 OAuth Provider 开始
- 只有在客户端生命周期确实需要时再增加动态注册

## 推进模式：先 Bearer，后 OAuth

如果你还在验证产品形态，更务实的顺序是：

1. 先为内部客户端上线 Bearer 鉴权
2. 验证作用域和路由保护
3. 当集成边界扩大时，再增加 OAuth 元数据以及授权码加 PKCE
4. 在更广泛的外部采用之前，把授权状态迁移到持久化 Provider 中

这种推进方式能让鉴权复杂度与真实采用阶段保持一致，而不是在还没有需要的客户端之前就提前引入完整的委托式授权体系。

## 当前生产边界

当前 OAuth 层已经比“仅用于演示的内存流程”更接近生产。它现在包含 PKCE、刷新令牌、动态注册、吊销，以及基于 SQLite 的持久化状态。

剩余工作不是基础正确性问题，主要集中在更深的互操作覆盖和更丰富的 Provider 选择上。精确的剩余项请参见 [MCP 差距与 TODO](/docs/mcp-gap)。

## 相关阅读

- [传输指南](/docs/transports)
- [服务器指南](/docs/servers)
- [客户端指南](/docs/clients)
- [MCP 差距与 TODO](/docs/mcp-gap)
