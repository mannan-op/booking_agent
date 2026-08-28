#!/usr/bin/env python3
"""Connect existing n8n workflows: 7B PRICING -> WF2 -> WF4 -> WF5 -> WF6 -> WF7A."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/home/mannan/booking_agent/workflows")


def load(name: str) -> dict:
    return json.loads((ROOT / name).read_text())


def save(name: str, data: dict) -> None:
    (ROOT / name).write_text(json.dumps(data, indent=2) + "\n")


def exec_workflow_node(
    *,
    node_id: str,
    name: str,
    workflow_id: str,
    workflow_name: str,
    inputs: dict[str, str],
    position: list[int],
) -> dict:
    schema = [
        {
            "id": key,
            "displayName": key,
            "required": False,
            "defaultMatch": False,
            "display": True,
            "canBeUsedToMatch": True,
            "type": "string",
            "removed": False,
        }
        for key in inputs
    ]
    return {
        "parameters": {
            "workflowId": {
                "__rl": True,
                "value": workflow_id,
                "mode": "list",
                "cachedResultUrl": f"/workflow/{workflow_id}",
                "cachedResultName": workflow_name,
            },
            "workflowInputs": {
                "mappingMode": "defineBelow",
                "value": inputs,
                "matchingColumns": [],
                "schema": schema,
                "attemptToConvertTypes": False,
                "convertFieldsToString": True,
            },
            "options": {"waitForSubWorkflow": True},
        },
        "type": "n8n-nodes-base.executeWorkflow",
        "typeVersion": 1.3,
        "position": position,
        "id": node_id,
        "name": name,
    }


def exec_trigger(node_id: str, name: str, fields: list[str], position: list[int]) -> dict:
    return {
        "parameters": {
            "workflowInputs": {"values": [{"name": field} for field in fields]},
        },
        "type": "n8n-nodes-base.executeWorkflowTrigger",
        "typeVersion": 1.2,
        "position": position,
        "id": node_id,
        "name": name,
    }


def patch_wf6() -> None:
    data = load("WorkFlow-6 Pricing (2).json")
    for node in data["nodes"]:
        if node["name"] == "set Product_id":
            node["parameters"]["assignments"]["assignments"] = [
                {
                    "id": "8e0184dd-56ed-4990-9ba6-58104042334c",
                    "name": "product_id",
                    "value": "={{ $json.product_id || 'P0001' }}",
                    "type": "string",
                },
                {
                    "id": "e2592f77-8929-47cd-8a68-ff893702d990",
                    "name": "model",
                    "value": "={{ $json.model || $json.query_model || 'HT03XL' }}",
                    "type": "string",
                },
            ]
    data["connections"]["When Executed by Another Workflow"] = {
        "main": [[{"node": "set Product_id", "type": "main", "index": 0}]]
    }
    save("WorkFlow-6 Pricing (2).json", data)


def patch_wf2() -> None:
    data = load("Workflow-2 Text-AI.json")
    names = {node["name"] for node in data["nodes"]}
    if "When Executed by WF7B" not in names:
        data["nodes"].append(
            exec_trigger(
                "wf2-exec-trigger-voltops",
                "When Executed by WF7B",
                ["conversation_id", "text", "raw_text", "channel"],
                [-160, 192],
            )
        )
        data["nodes"].append(
            {
                "parameters": {
                    "assignments": {
                        "assignments": [
                            {
                                "id": "wf2-map-text",
                                "name": "text",
                                "value": "={{ $json.text || $json.raw_text }}",
                                "type": "string",
                            },
                            {
                                "id": "wf2-map-conv",
                                "name": "conversation_id",
                                "value": "={{ $json.conversation_id }}",
                                "type": "string",
                            },
                        ]
                    },
                    "options": {},
                },
                "type": "n8n-nodes-base.set",
                "typeVersion": 3.5,
                "position": [80, 192],
                "id": "wf2-map-incoming-text",
                "name": "Use Incoming Customer Text",
            }
        )
        data["nodes"].append(
            exec_workflow_node(
                node_id="wf2-call-wf4",
                name="Call 'WorkFlow-4 Battery-Matching'",
                workflow_id="YkK1KmYPB6lDmZ0U",
                workflow_name="WorkFlow-4  Battery-Matching",
                inputs={
                    "laptop_model": "={{ $json.laptop_brand && $json.laptop_series ? ($json.laptop_brand + ' ' + $json.laptop_series) : ($json.model || '') }}",
                    "conversation_id": "={{ $('Use Incoming Customer Text').item.json.conversation_id }}",
                    "extracted_model": "={{ $json.model }}",
                },
                position=[2208, 144],
            )
        )
    data["connections"]["When Executed by WF7B"] = {
        "main": [[{"node": "Use Incoming Customer Text", "type": "main", "index": 0}]]
    }
    data["connections"]["Use Incoming Customer Text"] = {
        "main": [
            [
                {
                    "node": "LLM Extarcting the Required data from raw text",
                    "type": "main",
                    "index": 0,
                }
            ]
        ]
    }
    data["connections"]["Looping back to text message"] = {
        "main": [[{"node": "Call 'WorkFlow-4 Battery-Matching'", "type": "main", "index": 0}]]
    }
    save("Workflow-2 Text-AI.json", data)


def patch_wf4() -> None:
    data = load("WorkFlow-4  Battery-Matching.json")
    names = {node["name"] for node in data["nodes"]}
    if "When Executed by WF2" not in names:
        data["nodes"].append(
            exec_trigger(
                "wf4-exec-trigger-voltops",
                "When Executed by WF2",
                ["laptop_model", "conversation_id", "extracted_model"],
                [-224, -16],
            )
        )
        data["nodes"].append(
            exec_workflow_node(
                node_id="wf4-call-wf5",
                name="Call 'WorkFlow-5 IMS Search'",
                workflow_id="damAaJeRrATu9EzB",
                workflow_name="WorkFlow-5 IMS Search",
                inputs={
                    "likely_model": "={{ $('Middleware DB Check').item.json.matches[0].model || $json.extracted_model || $json.laptop_model }}",
                    "confidence": "0.9",
                    "extracted_text": "={{ $('Middleware DB Check').item.json.matches[0].model || $json.laptop_model }}",
                },
                position=[3040, -160],
            )
        )
    data["connections"]["When Executed by WF2"] = {
        "main": [[{"node": "Input Laptop Model", "type": "main", "index": 0}]]
    }
    for node in data["nodes"]:
        if node["name"] == "Input Laptop Model":
            node["parameters"]["assignments"]["assignments"][0]["value"] = (
                "={{ $json.laptop_model || 'HP EliteBook 840 G5' }}"
            )
        if node["name"] == "Laptop mode":
            node["parameters"]["assignments"]["assignments"][0]["value"] = (
                "={{ $json.laptop_model || $('Input Laptop Model').item.json.laptop_model }}"
            )
    data["connections"]["Save cmpatibility result"] = {
        "main": [[{"node": "Call 'WorkFlow-5 IMS Search'", "type": "main", "index": 0}]]
    }
    save("WorkFlow-4  Battery-Matching.json", data)


def patch_wf3() -> None:
    data = load("Workflow-3 Vision-AI.json")
    names = {node["name"] for node in data["nodes"]}
    if "When Executed by WF1" not in names:
        data["nodes"].append(
            exec_trigger(
                "wf3-exec-trigger-voltops",
                "When Executed by WF1",
                ["conversation_id", "channel", "text", "image_url"],
                [-200, 288],
            )
        )
    data["connections"]["When Executed by WF1"] = {
        "main": [[{"node": "Picture of battery given by user", "type": "main", "index": 0}]]
    }
    for node in data["nodes"]:
        if node["name"] == "Picture of battery given by user":
            for assignment in node["parameters"]["assignments"]["assignments"]:
                if assignment["name"] == "image_url":
                    assignment["value"] = (
                        "={{ $json.image_url || 'https://itonline.pk/wp-content/uploads/2026/08/LENOVO-T14-GEN-3-BATTERY-1-300x300.jpeg' }}"
                    )
                elif assignment["name"] in {"conversation_id", "channel", "text"}:
                    assignment["value"] = f"={{ $json.{assignment['name']} || '' }}"
    save("Workflow-3 Vision-AI.json", data)


def patch_wf1() -> None:
    data = load("Worflow 1-Query Intake (2).json")
    names = {node["name"] for node in data["nodes"]}
    if "Call 'Workflow-3 Vision-AI'" not in names:
        data["nodes"].append(
            exec_workflow_node(
                node_id="wf1-call-wf3",
                name="Call 'Workflow-3 Vision-AI'",
                workflow_id="W0kbSjS9geQMq4nM",
                workflow_name="Workflow-3 Vision-AI",
                inputs={
                    "conversation_id": "={{ $json.conversation_id }}",
                    "channel": "={{ $json.channel }}",
                    "text": "={{ $json.text }}",
                    "image_url": "={{ $json.image_url }}",
                },
                position=[720, 320],
            )
        )
    data["connections"]["Switch- content_type"] = {
        "main": [
            [{"node": "Call 'WorkFlow-7B Intent Classification'", "type": "main", "index": 0}],
            [{"node": "Call 'Workflow-3 Vision-AI'", "type": "main", "index": 0}],
        ]
    }
    prepared = "$('03 — Prepare Idempotency').item.json"
    for node in data["nodes"]:
        if node["name"] == "Call 'WorkFlow-7B Intent Classification'":
            node["parameters"]["workflowInputs"]["value"] = {
                "conversation_id": f"={{{{ {prepared}.conversation_id }}}}",
                "message_id": f"={{{{ {prepared}.message_id }}}}",
                "raw_text": f"={{{{ {prepared}.text }}}}",
                "image_url": f"={{{{ {prepared}.image_url }}}}",
            }
            node["parameters"]["options"] = {"waitForSubWorkflow": True}
        if node["name"] == "Call 'Workflow-3 Vision-AI'":
            node["parameters"]["workflowInputs"]["value"] = {
                "conversation_id": f"={{{{ {prepared}.conversation_id }}}}",
                "channel": f"={{{{ {prepared}.channel }}}}",
                "text": f"={{{{ {prepared}.text }}}}",
                "image_url": f"={{{{ {prepared}.image_url }}}}",
            }
    save("Worflow 1-Query Intake (2).json", data)


def patch_wf7b() -> None:
    data = load("WorkFlow-7B Intent Classification (2).json")
    names = {node["name"] for node in data["nodes"]}
    if "Call 'Workflow-2 Text-AI'" not in names:
        data["nodes"].append(
            exec_workflow_node(
                node_id="wf7b-call-wf2",
                name="Call 'Workflow-2 Text-AI'",
                workflow_id="o3ULi4E5Tyc6mShn",
                workflow_name="Workflow-2 Text-AI",
                inputs={
                    "conversation_id": "={{ $('Parse Intent JSON').item.json.conversation_id }}",
                    "text": "={{ $('Parse Intent JSON').item.json.raw_text }}",
                    "raw_text": "={{ $('Parse Intent JSON').item.json.raw_text }}",
                    "channel": "whatsapp",
                },
                position=[1536, 208],
            )
        )
    # Output 1 is PRICING — send into the battery matching chain instead of human review.
    # Fallback extra used to log a clarification with no WhatsApp copy.
    route = data["connections"]["Route By Intent"]["main"]
    route[1] = [{"node": "Call 'Workflow-2 Text-AI'", "type": "main", "index": 0}]
    if len(route) > 5:
        route[5] = [{"node": "Call 'Workflow-2 Text-AI'", "type": "main", "index": 0}]
    save("WorkFlow-7B Intent Classification (2).json", data)


def main() -> None:
    patch_wf6()
    patch_wf2()
    patch_wf4()
    patch_wf3()
    patch_wf1()
    patch_wf7b()
    print("Wired battery chain into existing n8n workflows.")


if __name__ == "__main__":
    main()
