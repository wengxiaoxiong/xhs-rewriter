ComfyUI API 服务入门
ComfyUI 托管工作流上线后即发布为 API 服务，支持通过 HTTP API 和 WebSocket 方式调用。

API 端点
GenStudio ComfyUI 服务提供了封装原始 ComfyUI HTTP 端点的新端点。以下是端点映射与 HTTP API 参考文档链接：

原始 ComfyUI 端点	描述	API 端点
POST /prompt	提交任务（文生图示例）	/api/maas/comfy_task_api/prompt
GET /history/	获取任务排队信息和生图结果	/api/maas/comfy_task_api/get_task_info
POST /interrupt	取消任务	/api/maas/comfy_task_api/cancel
POST /upload/image	上传图像	/api/maas/comfy_task_api/upload/image
/ws	实时获取任务进度和生图结果	wss://cloud.infini-ai.com/api/maas/comfy_task_ws_api/get_task_progress
GenStudio 的 API Base URL 为 https://cloud.infini-ai.com。

查询 API 端点的路径、参数等细节：
📋 ComfyUI 托管工作流 HTTP API 参考文档
📋 ComfyUI 托管工作流 HTTP API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
📋 ComfyUI 托管工作流 WebSocket API 参考文档
📋 ComfyUI 托管工作流 WebSocket API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
为了保障服务的稳定性及合理使用，我们对 GenStudio API 服务进行了频率限制。参见 API 频率限制。

API 鉴权设置
使用 API 服务，首先需要完成身份验证。请按照以下步骤获取您的 API 密钥：

API 密钥管理
复制已有的 API 密钥，或自助创建 API Key。
点击复制按钮获取密钥。您可能需要完成二次验证。
alt text

您将获取到一个格式为 sk- 前缀的 API 密钥，例如 sk-axbx5xcx9xAxbZyx。在后续的 CURL 请求中，请注意在 header 中传入自己的 API 密钥。


--header 'Authorization: Bearer sk-xxxxxxxxxxxxxxxx'
API 入参范围
由于 API 服务中的「生图任务接口」（/api/maas/comfy_task_api/prompt）定义是 基于用户上传的 ComfyUI 工作流文件动态生成的，因此，该 API 的接口定义（Schema），包括接受哪些参数、参数的数据类型、有效值范围等等，都 直接取决于用户工作流文件内部的节点配置和连接方式。

由于无法为生图任务接口提供统一的 OpenAPI 规范，为了帮助用户了解自己工作流的 API 输入要求，平台会基于您的工作流验证结果，自动生成详细的参数 Schema，即「入参范围」，其中展示工作流中各个节点的有效参数范围，例如 ckpt_name 的参数支持的 Checkpoint 列表，seed 的取值范围等。

您可在托管工作流的详情页获取入参范围。在通过代码集成 API 服务时，可以通过编程方式处理该数据，提取节点入参的类型、范围等。

alt text

平台会在每个可传入的参数的 spec 键下返回可接受的入参范围和默认值。


"spec": {
    "default": 20,
    "min": 1,
    "max": 10000
}
危险

「入参范围」仅提供数据参考，并非 ComfyUI API 请求 Body 体。请根据此信息构建 /api/maas/comfy_task_api/prompt 接口的 prompt 字段内容。

处理异步任务与获取结果
由于图片生成通常是一个耗时过程，提交任务的 /api/maas/comfy_task_api/prompt 接口会采用异步处理的方式：

接收请求：API 接收您的生图请求（包含工作流 ID 和要修改的参数）。
任务入队：将生图任务加入处理队列。
立即响应：API 立即返回一个包含任务 ID (prompt_id) 和 WebSocket 认证令牌 (prompt_token) 的响应，不会等待图片生成完成。
这个返回的 prompt_id 是您任务的唯一标识符，后续需要用它来查询任务状态和获取结果。

为了获取异步任务的实时进度和最终结果，我们提供了两种主要方式供您选择：

通过 HTTP 接口轮询

接口：/api/maas/comfy_task_api/get_task_info
方式：您需要使用之前获取到的任务 ID (prompt_id)，定期调用此接口（设置合适的轮询间隔，如每隔几秒）。
获取信息：查询任务的当前状态（例如：排队中、进行中、已完成、失败）、进度百分比、队列位置以及最终的生图结果文件链接（如果任务已完成）。
通过 WebSocket 接口实时推送

接口：wss://cloud.infini-ai.com/api/maas/comfy_task_ws_api/get_task_progress
方式：使用任务提交时获取的 prompt_token 建立 WebSocket 连接。
获取信息：连接建立后，服务器会在任务状态发生变化时（例如，进度更新、任务开始执行、任务完成或失败）主动向客户端推送 (Push) 最新的信息，包括状态、进度和结果文件链接。与轮询相比，WebSocket 提供了一个持久连接，服务器可以实时发送数据，通常能提供更低的延迟和更高效的资源利用。
您可以根据您的应用场景和需求，选择使用 HTTP 轮询或 WebSocket 推送来获取任务的进度和结果。

重要

关于结果文件存储的重要提示： GenStudio 生成的结果图片文件存储在阿里云 OSS 上。请注意，这些文件将在生成后 3 天自动过期并被删除。务必在此期限内下载并保存您需要的结果图片。一旦文件在 OSS 上被删除，即使您持有之前获取的有效 URL 链接，也将无法再访问到图片。

文生图任务
如果使用 GenStudio 托管文生图工作流，API 调用流程如下：

提交生图请求 (/api/maas/comfy_task_api/prompt)，将文生图任务加入队列，并获取任务 ID (prompt_id)。
使用任务 ID (prompt_id)，通过 HTTP 轮询 或 WebSocket 推送 的方式，监控任务状态，直到任务完成 (status: 3) 或失败 (status: 4)。
任务成功后，从获取的状态信息中提取结果图片链接并下载图像。
注意

首次体验时，可直接下载示例工作流后进行上传，无需上传自己的工作流。

在下面的流程中，我们将使用示例工作流，通过 API 提交一个文生图任务，并获取生成的图像。

文生图示例 Workflow
示例使用以下设置：

工作流 API JSON： ComfyUI 导出的文生图工作流
模型：majicMIX realistic 麦橘写实_v7.safetensors
采样器名称：ddim
调度器：karras
步骤：20
cfg：7
在通过 API 调用工作流时，动态修改工作流 API JSON 中的提示词为以下内容：

正面提示词：


Spiderman in a red suit standing in middle of a crowded place, 
skyscrapers in the background, cinematic, neon colors, realistic look
负面提示：


ugly, deformed
提交文生图任务
使用 API 提交文生图任务，需要使用 /api/maas/comfy_task_api/prompt 接口。JSON 请求体中的 workflow_id 为工作流 ID。prompt 对象中包含在当前请求中需要修改的节点参数（根据您的工作流和需求构建）。

危险

JSON 请求体中 prompt 参数的值需要根据您自己工作流的节点 ID 和可修改参数自行构建。

请勿在 prompt 参数中直接传入 ComfyUI 导出的 Workflow API JSON 文件。
请勿在 prompt 参数中直接传入 GenStudio Workflow 「查看参数」（即「入参范围」）的内容。「入参范围」仅用于参考。
CURL 请求可直接从试运行工作流界面中拷贝，示例如下（请替换 workflow_id 和 Authorization 为您自己的值）：


curl --request POST \
  --url https://cloud.infini-ai.com/api/maas/comfy_task_api/prompt \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer sk-xxxxxxxxxxxxxxxx' \
  --header 'Content-Type: application/json' \
  --data '{
    "workflow_id": "wf-c73diz7kadp6ffgn",
    "prompt": {
      "3": {
        "inputs": {
          "seed": 423710630168223,
          "steps": 20,
          "cfg": 7,
          "sampler_name": "ddim",
          "scheduler": "karras",
          "denoise": 1
        }
      },
      "4": {
        "inputs": {
          "ckpt_name": "majicMIX realistic 麦橘写实_v7.safetensors"
        }
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        }
      },
      "6": {
        "inputs": {
          "text": "Rabbit in a red suit standing in middle of a crowded place, skyscrapers in the background, cinematic, neon colors, realistic look"
        }
      },
      "7": {
        "inputs": {
          "text": "ugly, deformed"
        }
      }
    }
  }'
接口将立即返回 200 OK 响应，其中包含任务 ID (prompt_id) 和 WebSocket 令牌 (prompt_token)。


{
    "code": 0,
    "msg": "Success",
    "data": {
        "prompt_id": "cft-c73egpxvlvg76yjd",
        "prompt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiJ0ZS1iOTA1NzU0NDI3MzUyMjYxIiwidGFza19pZCI6ImNmdC1jNzZ1anllemdlcDVwY2FsIiwiaXNzIjoiaW5maW5pIiwiZXhwIjoxNzI4Njk5OTYzfQ.yrWt9_tyKYH_0lZHuFG8l76ddFGgDMV68ZqdZtRAUHA"
    }
}
获取文生图任务状态和结果 (HTTP 轮询方式)
如 处理异步任务与获取结果 中所述，您可以使用 HTTP 轮询或 WebSocket 推送来获取结果。这里演示 HTTP 轮询方式。

调用 /api/maas/comfy_task_api/get_task_info 接口，传入之前获取的任务 ID (prompt_id)。

参数说明:

comfy_task_ids: 一个包含一个或多个任务 ID (prompt_id) 的数组。
url_expire_period (可选): 用于设置 API 返回的生图结果图片链接 (OSS URL) 的有效时长，单位为秒。不传时默认 600 秒（10 分钟）过期。
注意

关于 url_expire_period 和文件生命周期:

url_expire_period 参数仅控制本次 API 调用返回的访问链接 (OSS URL) 何时失效，不影响 OSS 对象存储中图片文件本身的生命周期。
只要 OSS 上的图片文件未过期（即生成后的 3 天内），您可以随时通过 /get_task_info 接口多次获取新的图片链接 URL，并且每次获取时都可以独立设置该链接的 url_expire_period。
新获取的 OSS URL 链接不会使旧的链接失效。旧链接是否失效取决于您为旧链接设置的 url_expire_period，以及 OSS 对象存储中图片文件的生命周期。
请务必注意，OSS 上存储的生图结果图片文件将在生成后 3 天自动过期并删除。一旦文件在 OSS 上删除，任何之前生成的或新获取的链接都将失效，无法再访问到图片。
CURL 请求正文示例如下（请替换 comfy_task_ids 中的 ID 和 Authorization）：


curl --request POST \
  --url https://cloud.infini-ai.com/api/maas/comfy_task_api/get_task_info \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer 123' \
  --header 'Content-Type: application/json' \
  --data '{
  "comfy_task_ids": [
    "cft-c73egpxvlvg76yjd"
  ],
  "url_expire_period": 1000
}'
您需要定期调用此接口，检查响应中对应任务 ID 的 status 字段。

status 取值范围：1-排队中，2-生成中，3-生成成功，4-生成失败或用户已取消任务，5-权限不足。
当 status 变为 3 时，表示生图已成功。此时，files 和 final_files 字段会包含结果图片的 OSS URL。

200 OK 响应示例（任务成功）：


{
    "code": 0,
    "msg": "Success",
    "data": {
        "comfy_task_info": [
            {
                "comfy_task_id": "cft-c73egpxvlvg76yjd",
                "status": 3,
                "queue_size": 0,
                "current_position": 0,
                "errMsg": "",
                "files": {
                    "9": [
                        "https://infini-imagegen.oss-cn-beijing.aliyuncs.com/te-b905754427352261%2Fac-c66h4ddlwutmbinv%2Fcft-c73egpxvlvg76yjd%2Fbb5c49b3-e1a8-4a46-b2ab-51aa47d9bbfc.png?Expires=1726642626\u0026OSSAccessKeyId=LTAI5tBgzFapTV38XHKZjHPa\u0026Signature=c2K4wQKbirfirwL0bgX%2FNDSF4iA%3D"
                    ]
                },
                "final_files": [
                        "https://infini-imagegen.oss-cn-beijing.aliyuncs.com/te-b905754427352261%2Fac-c66h4ddlwutmbinv%2Fcft-c76ujyezgep5pcal%2F83f2227c-9c1a-4e6a-813b-1359e2d1867e.png?Expires=1728615208&OSSAccessKeyId=LTAI5tBgzFapTV38XHKZjHPa&Signature=V1XbMwpAYXBt8eD1FN690kKcnVk%3D"
                      ],
               "progress_num": 100
            }
        ]
    }
}
files 字段是一个对象，键是工作流中输出文件节点的 ID (如示例中的 "9")，值是该节点输出的图片 URL 列表。final_files 字段是一个包含所有最终输出图片 URL 的数组。progress_num 字段为任务进度（0-100）。

下载图片:

获取到图片 URL 后，需要先对其进行解码（因为可能包含 \uXXXX 或 %XX 编码），然后才能使用 curl 或其他工具下载。


# URL (从 API 响应中获取，可能包含编码)
url_encoded='https://infini-imagegen.oss-cn-beijing.aliyuncs.com/te-b905754427352261%2Fac-c66h4ddlwutmbinv%2Fcft-c73egpxvlvg76yjd%2Fbb5c49b3-e1a8-4a46-b2ab-51aa47d9bbfc.png?Expires=1726642626\u0026OSSAccessKeyId=LTAI5tBgzFapTV38XHKZjHPa\u0026Signature=c2K4wQKbirfirwL0bgX%2FNDSF4iA%3D'
# 解码 (示例使用 printf，不同环境或语言可能有不同方法)
decoded_url=$(printf '%b' "$(echo "$url_encoded" | sed 's/\\u/\\\\u/g')") # Bash/Zsh, handling unicode escapes
# 下载
curl -o spiderman-in-red-suit.png "$decoded_url"
以下是结果图片：

alt text

查询 API 端点的路径、参数等细节：
📋 ComfyUI 托管工作流 HTTP API 参考文档
📋 ComfyUI 托管工作流 HTTP API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
图生图任务
如果使用 GenStudio 托管图生图 (Image-to-Image) 工作流，API 调用流程如下：

准备输入图片：
方式一 (推荐)：调用 /api/maas/comfy_task_api/upload/image 接口，将本地图片上传至 GenStudio 服务，获取 image_id。
方式二：如果您已将图片上传至自己的阿里云 OSS 或亚马逊 S3，可以直接获取其公开可读的 URL。
提交生图请求 (/api/maas/comfy_task_api/prompt)：将图生图任务加入队列。在 prompt 参数中，为工作流中的 LoadImage / LoadImageMask 等节点传入上一步获取的 image_id 或 OSS URL，并获取任务 ID (prompt_id)。
获取任务状态和结果：使用任务 ID (prompt_id)，通过 HTTP 轮询 或 WebSocket 推送 的方式，监控任务状态，直到任务完成 (status: 3) 或失败 (status: 4)。
下载结果：任务成功后，从获取的状态信息中提取结果图片链接并下载图像。
下面我们将使用示例工作流，以前面文生图的结果作为输入图片，通过 API 提交一个图生图任务，并获取修改后的图像。

图生图示例 Workflow
示例使用以下设置：

工作流 API JSON： ComfyUI 导出的图生图工作流
模型：majicMIX realistic 麦橘写实_v7.safetensors
采样器名称：ddim
调度器：karras
步骤：30
cfg：9
denoise: 0.6
在通过 API 调用工作流时，动态修改工作流 API JSON 中的提示词为以下内容：

正面提示词：


 dressed entirely in monochromatic, pure black suit standing in middle of a crowded place, 
 skyscrapers in the background, cinematic, neon colors, realistic look
负面提示：


ugly, deformed, red, reddish, blue
输入图片：使用上一节生成的 spiderman-in-red-suit.png。

上传图片至 GenStudio (可选)
提示

如果您的输入图片已自行上传至公开可访问的阿里云 OSS 或亚马逊 S3，并获取了其 URL，则可以跳过本步骤，在下一步提交任务时直接传入该 URL。GenStudio 支持直接为 LoadImage / LoadImageMask 节点传入这两种 OSS 的图片链接。

使用 /api/maas/comfy_task_api/upload/image 接口上传本地图片。使用 --form 参数指定文件。GenStudio 收到图片文件后将存入内部 OSS，并返回 image_id 供后续任务引用。


curl --request POST \
  --url https://cloud.infini-ai.com/api/maas/comfy_task_api/upload/image \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer sk-xxxxxxxxxxxxxxxx' \
  --header 'Content-Type: multipart/form-data' \
  --form source_file=@/Users/janedoe/spiderman-in-red-suit.png
示例中使用的是 macOS/Linux 的路径格式，Windows 用户需要使用不同的格式（如 C:\Users\janedoe\pictures\spiderman-in-red-suit.png）。

重要

如果您使用 Apifox/Postman 等工具，请确保正确设置 source_file 参数的类型为 file。推荐您直接导入 GenStudio 提供的 OpenAPI 规范文件，避免手动配置接口导致错误。

📖 第三方 API 工具：在 Postman/Apifox 中使用 GenStudio API 文档
📖 第三方 API 工具：在 Postman/Apifox 中使用 GenStudio API 文档
教程
直接获取 GenStudio API 服务的 OpenAPI 格式的规范文件，在第三方 OpenAPI 工具中导入
200 OK 响应示例：


{
    "code": 0,
    "msg": "Success",
    "data": {
        "image_id": "te-b905754427352261/ac-c66h4ddlwutmbinv/sui-c73eqoorz56qaq7q.png"
    }
}
提交图生图任务
使用 /api/maas/comfy_task_api/prompt 接口提交任务。在 prompt 对象中，找到对应的 LoadImage 节点（根据您的工作流，节点 ID 可能不同，这里假设是 "10"），并将其 image 输入设置为上一步获取的 image_id 或您自备的 OSS URL。

危险

同样，prompt 参数的值需要根据您自己工作流的节点 ID 和可修改参数构建。请勿直接传入导出的 Workflow JSON 或「入参范围」JSON。

CURL 请求示例如下（请替换 workflow_id, Authorization, 和 image_id）：


curl --request POST \
  --url https://cloud.infini-ai.com/api/maas/comfy_task_api/prompt \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer sk-xxxxxxxxxxxxxxxx' \
  --header 'Content-Type: application/json' \
  --data '{
    "workflow_id": "wf-c73epllu4i3bxvzr",
    "prompt": {
      "3": {
        "inputs": {
          "seed": 423710630168223,
          "steps": 30,
          "cfg": 9,
          "sampler_name": "ddim",
          "scheduler": "karras",
          "denoise": 0.6
        }
      },
      "4": {
        "inputs": {
          "ckpt_name": "majicMIX realistic 麦橘写实_v7.safetensors"
        }
      },
      "6": {
        "inputs": {
          "text": "Spiderwoman dressed entirely in monochromatic, pure black suit standing in middle of a crowded place, skyscrapers in the background, cinematic, neon colors, realistic look"
        }
      },
      "7": {
        "inputs": {
          "text": "ugly, deformed, red, reddish, blue"
        }
      },
      "10": {
        "inputs": {
          "image": "te-b905754427352261/ac-c66h4ddlwutmbinv/sui-c73eqoorz56qaq7q.png"
        }
      }
    }
  }'
接口将立即返回 200 OK 响应，包含新的任务 ID (prompt_id) 和 prompt_token。


{
"code": 0,
"msg": "Success",
"data": {
"prompt_id": "cft-c73e5ci6dwb5wfhl", // 新的任务 ID
"prompt_token": "..." // 新的 WebSocket token
}
}
获取图生图任务状态和结果 (HTTP 轮询方式)
与文生图类似，您可以使用 HTTP 轮询或 WebSocket 推送来获取结果。这里继续演示 HTTP 轮询方式。

调用 /api/maas/comfy_task_api/get_task_info 接口，传入图生图任务返回的 prompt_id。

参数说明: (同文生图)

comfy_task_ids: 包含一个或多个任务 ID (prompt_id) 的数组。
url_expire_period (可选): 设置返回的图片链接的有效时长（秒），默认 600。
注意

关于 url_expire_period 和文件生命周期: (同文生图)

url_expire_period 控制本次返回的 URL 链接有效期。
3 天内可多次调用接口获取新的、独立有效期的 URL。
OSS 上的文件在生成 3 天后会自动删除，届时所有链接失效。
CURL 请求正文示例如下（请替换 comfy_task_ids 中的 ID 和 Authorization）：


curl --request POST \
  --url https://cloud.infini-ai.com/api/maas/comfy_task_api/get_task_info \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer sk-xxxxxxxxxxxxxxxx' \
  --header 'Content-Type: application/json' \
  --data '{
  "comfy_task_ids": [
    "cft-c73e5ci6dwb5wfhl"
  ],
  "url_expire_period": 1000
}'
轮询此接口，直到对应任务 ID 的 status 变为 3。

200 OK 响应示例（任务成功）：


{
    "code": 0,
    "msg": "Success",
    "data": {
        "comfy_task_info": [
            {
                "comfy_task_id": "cft-c73e5ci6dwb5wfhl",
                "status": 3,
                "queue_size": 0,
                "current_position": 0,
                "errMsg": "",
                "files": {
                    "9": [
                        "https://infini-imagegen.oss-cn-beijing.aliyuncs.com/te-b905754427352261%2Fac-c66h4ddlwutmbinv%2Fcft-c73e5ci6dwb5wfhl%2F4e066af5-79df-40ab-8a2d-57012b3f94b3.png?Expires=1726654989\u0026OSSAccessKeyId=LTAI5tBgzFapTV38XHKZjHPa\u0026Signature=28hPa004ivIW4WX%2BpueVTvQcLXw%3D"
                    ]
                },
                "final_files": [
                    "https://infini-imagegen.oss-cn-beijing.aliyuncs.com/te-b905754427352261%2Fac-c66h4ddlwutmbinv%2Fcft-c76ujyezgep5pcal%2F83f2227c-9c1a-4e6a-813b-1359e2d1867e.png?Expires=1728615208&OSSAccessKeyId=LTAI5tBgzFapTV38XHKZjHPa&Signature=V1XbMwpAYXBt8eD1FN690kKcnVk%3D"
                ],
                "progress_num": 100
            }
        ]
    }
}
status, files, final_files, progress_num 字段含义同文生图。

下载图片:

同样，需要先解码 URL 再下载。


# URL (从 API 响应中获取)
url_encoded='https://infini-imagegen.oss-cn-beijing.aliyuncs.com/te-b905754427352261%2Fac-c66h4ddlwutmbinv%2Fcft-c73e5ci6dwb5wfhl%2F4e066af5-79df-40ab-8a2d-57012b3f94b3.png?Expires=1726654989\u0026OSSAccessKeyId=LTAI5tBgzFapTV38XHKZjHPa\u0026Signature=28hPa004ivIW4WX%2BpueVTvQcLXw%3D'
# 解码 (示例)
decoded_url=$(printf '%b' "$(echo "$url_encoded" | sed 's/\\u/\\\\u/g')")
# 下载
curl -o spiderwoman-in-black-suit.png "$decoded_url"
以下是结果图片：

alt text

查询 API 端点的路径、参数等细节：
📋 ComfyUI 托管工作流 HTTP API 参考文档
📋 ComfyUI 托管工作流 HTTP API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
📋 ComfyUI 托管工作流 WebSocket API 参考文档
📋 ComfyUI 托管工作流 WebSocket API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
实时获取任务进度 (WebSocket 方式)
您可以使用 WebSocket API (wss://cloud.infini-ai.com/api/maas/comfy_task_ws_api/get_task_progress) 来实时接收任务进度更新，避免轮询。

WebSocket 连接信息
API URL: wss://cloud.infini-ai.com/api/maas/comfy_task_ws_api/get_task_progress

鉴权 Token: 使用提交任务 (/api/maas/comfy_task_api/prompt) 时返回的 prompt_token。该 Token 有效期为 24 小时。

Step 0 建立 WebSocket 连接
建立 WebSocket 连接时，必须将 prompt_token 作为 URL 查询参数 authorization 的值附加在 URL 后面（?authorization=）。


const promptToken = "your_prompt_token_here"; // 替换为实际的 prompt_token
const socket = new WebSocket(
  `wss://cloud.infini-ai.com/api/maas/comfy_task_ws_api/get_task_progress?authorization=${promptToken}`
);

socket.onopen = () => {
  console.log("WebSocket 连接已建立");
  // 连接建立后，服务器会自动开始推送该 token 对应任务的进度更新
};

socket.onerror = (error) => {
  console.error("WebSocket 错误:", error);
};

socket.onclose = (event) => {
  console.log("WebSocket 连接已关闭:", event.code, event.reason);
  // 注意：任务完成或失败后，服务器可能会主动关闭连接
};
注意

不支持在建立 WebSocket 连接后通过发送消息的方式进行鉴权。Token 必须作为 URL 参数在初始连接请求中提供。

Step 1 接收和处理任务进度
连接建立后，通过监听 onmessage 事件接收服务器推送的消息。每个消息都包含任务的最新状态信息。

消息结构: 收到的消息是一个 JSON 字符串，解析后结构类似：


{
  "comfy_task_info": {
    "comfy_task_id": "cft-c76vnohm2zwmmoyj",
    "status": 2, // 1-排队中, 2-生成中, 3-成功, 4-生成失败或用户已取消任务
    "queue_size": 5,
    "current_position": 3,
    "errMsg": "", // 失败时的错误信息
    "files": {
      // 可能包含中间或部分结果，结构取决于工作流
      "9": [
        /* URL list */
      ]
    },
    "final_files": [], // 通常在任务完成时填充
    "progress_num": 45 // 进度 0-100
  }
}
处理逻辑: 您需要解析 JSON 数据，并根据 comfy_task_info 中的字段更新您的 UI 或执行相应逻辑。

关于 files vs final_files:

files: 这个字段可能包含工作流中所有标记为输出的节点（如 SaveImage）生成的文件链接。在任务执行过程中，它可能包含中间结果或部分结果。其具体内容和结构取决于您的工作流设计。
final_files: 这个字段通常设计为在任务成功完成时，包含最终的、用户最关心的输出图片链接列表。
建议在处理时：

主要依赖 status 和 progress_num 来显示任务状态和进度条。
当 status 为 3 且 progress_num 为 100 时，处理 final_files 字段以获取最终结果。
如果需要展示中间预览，可以谨慎地处理 files 字段，但要理解其内容可能不完整或非最终。

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data.comfy_task_info) {
      const taskInfo = data.comfy_task_info;

      // 显示任务进度和状态
      displayTaskProgress(taskInfo);

      // 当任务成功完成时，处理最终文件
      if (taskInfo.status === 3 && taskInfo.progress_num === 100) {
        console.log("任务成功完成，处理最终结果文件:");
        if (taskInfo.final_files && taskInfo.final_files.length > 0) {
          // 解码并显示最终结果图片
          displayResultFiles(
            taskInfo.final_files.map(decodeAndCleanUrl),
            "final-results"
          );
        } else if (taskInfo.files) {
          // 如果 final_files 为空但 files 有内容，可能需要根据节点 ID 处理 files
          console.warn("final_files 为空，尝试从 files 获取结果...");
          // Example: Process files from a specific node ID like '9'
          const outputNodeId = "9"; // Change this based on your workflow's output node
          if (taskInfo.files[outputNodeId]) {
            displayResultFiles(
              taskInfo.files[outputNodeId].map(decodeAndCleanUrl),
              "final-results"
            );
          }
        }
      }
      // (可选) 如果需要实时预览，可以处理 files 字段
      // else if (taskInfo.status === 2 && taskInfo.files) { ... }
    } else {
      console.log("收到非任务进度消息:", data);
    }
  } catch (e) {
    console.error("处理 WebSocket 消息失败:", e, "原始数据:", event.data);
  }
};

function displayTaskProgress(taskInfo) {
  const progressElement = document.getElementById("task-progress"); // Assume you have an element with this ID
  if (!progressElement) return;
  progressElement.innerHTML = `
    <p>任务ID: ${taskInfo.comfy_task_id}</p>
    <p>状态: ${getStatusText(taskInfo.status)}</p>
    <p>进度: ${taskInfo.progress_num}%</p>
    <p>队列位置: ${
      taskInfo.current_position > 0
        ? taskInfo.current_position + " / " + taskInfo.queue_size
        : "N/A"
    }</p>
    ${
      taskInfo.errMsg
        ? `<p style="color: red;">错误: ${taskInfo.errMsg}</p>`
        : ""
    }
  `;
}

function getStatusText(status) {
  const statusMap = {
    1: "排队中",
    2: "生成中",
    3: "生成成功",
    4: "生成失败或用户已取消任务",
    5: "权限不足",
  };
  return statusMap[status] || "未知状态";
}

function displayResultFiles(fileUrls, containerId) {
  const filesElement = document.getElementById(containerId); // Assume you have an element for results
  if (!filesElement) return;
  filesElement.innerHTML = ""; // Clear previous results for this container
  fileUrls.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "结果图片";
    img.style.maxWidth = "200px"; // Example styling
    img.style.margin = "5px";
    filesElement.appendChild(img);
  });
}

// 直接返回的 OSS 链接可能包含 \u 或 % 编码，请解码后使用。
function decodeAndCleanUrl(url) {
  try {
    // First, decode URI components like %2F, %3D etc.
    let decodedUrl = decodeURIComponent(url);
    // Then, replace JSON string unicode escapes like \u0026
    decodedUrl = decodedUrl.replace(/\\u([\dA-F]{4})/gi, (match, grp) =>
      String.fromCharCode(parseInt(grp, 16))
    );
    return decodedUrl;
  } catch (e) {
    console.error("URL 解码失败:", e, "原始 URL:", url);
    return url; // Return original URL if decoding fails
  }
}
注意

URL 解码: 直接从 API 或 WebSocket 消息中获取的 OSS 链接可能包含 \uXXXX (JSON Unicode 转义) 或 %XX (URL 编码) 字符。在使用这些 URL（例如设置为 <img> 的 src 属性或用于下载）之前，必须进行解码。请参考示例代码中的 decodeAndCleanUrl 函数。
URL 有效期: WebSocket 推送的 URL 默认有效期通常较短（例如 10 分钟，与 HTTP 轮询默认值一致）。请及时处理或下载结果文件。
消息频率与处理: 进度更新可能会频繁推送。每次更新通常包含任务的全量当前状态信息。请优化您的 UI 更新逻辑，避免不必要的重绘或重复处理相同的文件链接。
连接关闭: 当任务达到最终状态（成功或失败）后，服务器可能会自动关闭 WebSocket 连接。您也可以在客户端实现超时逻辑，例如，如果在一段时间内没有收到任何进度更新，则主动断开连接。
连接数限制: 暂不限制单个用户或任务的 WebSocket 连接数量，但请合理使用资源。
files vs final_files 内容: 请注意 files 和 final_files 中具体包含哪些 URL 取决于您工作流的配置（哪些节点被连接到了输出）。建议在开发时检查实际收到的数据结构。
查询 API 端点的路径、参数等细节：
📋 ComfyUI 托管工作流 WebSocket API 参考文档
📋 ComfyUI 托管工作流 WebSocket API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
图片后处理
在通过 /api/maas/comfy_task_api/get_task_info 接口获取 ComfyUI 生成的图片结果时，您可以指定 image_post_process_cmd 参数，对图片进行实时的格式转换和质量调整。

工作原理: 您提供的处理指令（如格式转换为 JPG、质量设为 80）会被平台透传给阿里云对象存储服务 (OSS)。API 响应中返回的图片 OSS URL 将自动包含这些处理参数。当您通过该链接访问图片时，阿里云 OSS 服务会根据 URL 中的参数实时处理图片，并返回处理后的结果，而不会修改存储在 OSS 上的原始图片文件。

支持的操作: 目前支持基于阿里云 OSS 图片处理能力的以下操作：

format: 指定目标图片格式。请参考阿里云官方文档 格式转换 支持的格式。
quality: 调整图片质量（主要对 JPG、WebP 等有损格式有效）。请参考阿里云官方文档 质量变换 的参数说明。
如何使用: 在调用 /api/maas/comfy_task_api/get_task_info 接口时，在请求体中加入 image_post_process_cmd 对象。

示例请求体:


{
  "comfy_task_ids": ["cft-c73e5ci6dwb5wfhl"],
  "url_expire_period": 1000,
  "image_post_process_cmd": {
    "format": "jpg", // 将图片格式转换为 JPG
    "quality": {
      // 设置 JPG 质量参数
      "q": 80 // 相对质量为 80 (范围 1-100)
      // "Q": 90 // 也可以使用绝对质量 Q (范围 1-100)
    }
  }
}
API 返回的图片 URL 将包含类似 ?x-oss-process=image/format,jpg/quality,q_80 的参数。

具体参数结构与用法请参考 /get_task_info 接口的 API 文档。

常见问题
支持什么 ComfyUI 节点？
平台预置的 ComfyUI 运行环境中包含部分常用模型和自定义节点。您可以在托管工作流详情页的「关联运行环境」部分查看当前环境预装的基础模型和自定义节点列表。

📋 ComfyUI 托管工作流 HTTP API 参考文档
📋 ComfyUI 托管工作流 HTTP API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
📋 ComfyUI 托管工作流 WebSocket API 参考文档
📋 ComfyUI 托管工作流 WebSocket API 参考文档
API 文档
GenStudio 提供了 ComfyUI 工作流托管和 API 服务化平台，用户仅需托管工作流，在业务中对接 API 服务，由平台负责维护服务、增减算力和优化效率。
如果预置环境缺少您工作流所需的特定 Checkpoint、LoRA、ControlNet 模型或自定义节点，GenStudio 支持为您定制私有运行环境。请联系商务或售后服务获取支持。

为何 ComfyUI 服务生图任务接口没有统一的 OpenAPI 规范？
这是因为 ComfyUI 工作流 API 服务的「提交生图任务接口」（/api/maas/comfy_task_api/prompt）的输入参数结构 (prompt 字段内容) 是完全基于用户上传的 ComfyUI 工作流文件动态生成的。

原因详解:

工作流的高度可定制性: ComfyUI 的核心优势在于其灵活性。每个用户可以设计出包含不同节点、不同连接方式、不同输入参数的工作流。例如，一个工作流可能需要 seed, steps, positive_prompt, negative_prompt 和 input_image，而另一个可能只需要 seed, text_prompt, 和 style_preset。
API 输入的动态生成: 当您上传并发布一个工作流后，GenStudio 平台会解析这个工作流文件，识别出其中可以作为输入的节点参数（通常是那些没有输入连接的原始值节点，如 KSampler 的 seed/steps/cfg，CLIPTextEncode 的 text，LoadImage 的 image 等）。/prompt 接口需要接受的参数，就是这些被识别出的、用户可在运行时动态指定的参数。
结果: 每个托管的工作流，其对应的 /prompt 接口实际接受的参数集合、名称、甚至数据类型（虽然平台会尝试标准化常见类型）都可能是独一无二的。
平台提供的「入参范围」的作用:

由于无法为 /prompt 接口提供一个固定的、适用于所有工作流的 OpenAPI 规范，平台采取了以下方式帮助开发者了解自己特定工作流的输入要求：

工作流验证与解析: 上传工作流时，平台会对其进行验证和深度解析。
动态生成参数 Schema: 基于解析结果，平台为您的每个工作流自动生成一份详细的参数 Schema，描述了该工作流的 /prompt 接口可以接受哪些参数（节点 ID + 输入名称）、每个参数的数据类型、默认值以及可能的取值范围或枚举列表（例如，支持的 ckpt_name 列表，sampler_name 列表，数值的 min/max 等）。
Web 控制台展示「入参范围」: 这份动态生成的 Schema 以 「入参范围」 的形式，直观地展示在托管工作流的详情页上。
如何使用「入参范围」？

这份「入参范围」就是您特定工作流的 /prompt 接口的事实上的 API 输入规范文档。您应该：

查看它：了解您的工作流需要哪些输入参数（以节点 ID 和输入名称标识）。
参考它：构建 /prompt 接口请求体中的 prompt 对象时，确保参数名称、结构和值符合「入参范围」的要求。
利用它：对于有范围或枚举值的参数（如模型、采样器），「入参范围」提供了有效选项，避免传入无效值。
（可选）编程处理：您可以复制「入参范围」的 JSON 数据，在代码中进行解析，用于动态生成 UI 或进行客户端验证。
API 服务可以直接传入工作流 API JSON 吗？
不可以。

提交生图任务 (/api/maas/comfy_task_api/prompt): 此接口有自己特定的请求体结构，其核心是 workflow_id 和 prompt 对象。prompt 对象用于覆盖或指定工作流中部分节点的输入参数值，而不是传入整个工作流的定义。
请勿将从 ComfyUI 界面导出的 "API Format" JSON 直接作为 prompt 字段的值。
请勿将 GenStudio 工作流详情页「入参范围」展示的 JSON 直接作为 prompt 字段的值。「入参范围」是用来参考如何构建 prompt 字段内容的，不是其本身。
创建或更新托管工作流: GenStudio 托管工作流服务目前仅支持通过控制台网页界面上传和管理工作流文件，不支持通过 API 方式创建新的托管工作流或上传新的工作流 JSON 文件。
查询 API 端点的路径、参数等细节：