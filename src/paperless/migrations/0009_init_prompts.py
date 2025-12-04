from django.db import migrations


DOC_READ_DEFAULT = """
You are a helpful assistant that answers questions about the provided document.
Only use the document content to answer. If you cannot find the answer in the document, explicitly say so.
""".strip()

VLM_ANALYSIS_IMAGE_DEFAULT = """
你是一个图像理解模型，任务是从提供的文档图片中尽可能完整、准确地提取所有可见文字，并以纯文本形式返回。
""".strip()


def create_default_prompts(apps, schema_editor):
    Prompt = apps.get_model("paperless", "Prompt")

    Prompt.objects.update_or_create(
        type="DOC_READ",
        defaults={"content": DOC_READ_DEFAULT},
    )
    Prompt.objects.update_or_create(
        type="VLM_ANALYSIS_IMAGE",
        defaults={"content": VLM_ANALYSIS_IMAGE_DEFAULT},
    )


def reverse_default_prompts(apps, schema_editor):
    Prompt = apps.get_model("paperless", "Prompt")
    Prompt.objects.filter(type__in=["DOC_READ", "VLM_ANALYSIS_IMAGE"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("paperless", "0008_prompt"),
    ]

    operations = [
        migrations.RunPython(create_default_prompts, reverse_default_prompts),
    ]



