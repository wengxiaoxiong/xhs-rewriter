使用例子

curl --location 'https://cloud.infini-ai.com/api/maas/comfy_task_api/prompt' \
--header 'Authorization: Bearer $API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "workflow_id": "wf-dbg5cnl3qrhcz57y",
  "prompt": {
    "6": {
      "inputs": {
        "speak_and_recognation": {
          "__value__": [
            false,
            true
          ]
        },
        "text": "the girl is running"
      }
    },
    "31": {
      "inputs": {
        "cfg": 1,
        "denoise": 1,
        "sampler_name": "euler",
        "scheduler": "simple",
        "seed": 1045912303560358,
        "steps": 20
      }
    },
    "35": {
      "inputs": {
        "guidance": 2.5
      }
    },
    "37": {
      "inputs": {
        "unet_name": "flux1-dev-kontext_fp8_scaled.safetensors",
        "weight_dtype": "default"
      }
    },
    "38": {
      "inputs": {
        "clip_name1": "flux/clip_l.safetensors",
        "clip_name2": "flux/t5xxl_fp8_e4m3fn.safetensors",
        "device": "default",
        "type": "flux"
      }
    },
    "39": {
      "inputs": {
        "vae_name": "flux/ae.safetensors"
      }
    },
    "146": {
      "inputs": {
        "direction": "right",
        "match_image_size": true,
        "spacing_color": "white",
        "spacing_width": 0
      }
    },
    "189": {
      "inputs": {
        "image": "04.png"
      }
    }
  }
}'