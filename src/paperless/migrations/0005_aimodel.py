from django.db import migrations, models
from django.utils.translation import gettext_lazy as _


class Migration(migrations.Migration):
    dependencies = [
        ("paperless", "0004_applicationconfiguration_barcode_asn_prefix_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        max_length=128,
                        unique=True,
                        verbose_name=_("display name"),
                    ),
                ),
                (
                    "supplier",
                    models.CharField(
                        choices=[
                            ("deepseek", _("DeepSeek")),
                            ("volcano_engine", _("Volcano Engine")),
                        ],
                        max_length=64,
                        verbose_name=_("supplier"),
                    ),
                ),
                (
                    "model_type",
                    models.CharField(
                        default="llm",
                        max_length=64,
                        verbose_name=_("model type"),
                    ),
                ),
                (
                    "base_model",
                    models.CharField(
                        max_length=128,
                        verbose_name=_("base model"),
                    ),
                ),
                (
                    "api_domain",
                    models.CharField(
                        max_length=256,
                        verbose_name=_("API domain"),
                    ),
                ),
                (
                    "api_key",
                    models.TextField(
                        verbose_name=_("API key"),
                    ),
                ),
                (
                    "params",
                    models.JSONField(
                        blank=True,
                        null=True,
                        verbose_name=_("advanced parameters"),
                    ),
                ),
                (
                    "is_default",
                    models.BooleanField(
                        default=False,
                        verbose_name=_("default model"),
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        verbose_name=_("created at"),
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                        verbose_name=_("updated at"),
                    ),
                ),
            ],
            options={
                "verbose_name": _("AI model"),
                "verbose_name_plural": _("AI models"),
            },
        ),
    ]


