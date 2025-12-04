from django.db import migrations, models
from django.utils.translation import gettext_lazy as _


class Migration(migrations.Migration):
    dependencies = [
        ("paperless", "0007_alter_aimodel_supplier"),
    ]

    operations = [
        migrations.CreateModel(
            name="Prompt",
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
                    "type",
                    models.CharField(
                        max_length=64,
                        unique=True,
                        verbose_name=_("prompt type"),
                    ),
                ),
                (
                    "content",
                    models.TextField(
                        verbose_name=_("prompt content"),
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
                "verbose_name": _("Prompt"),
                "verbose_name_plural": _("Prompts"),
            },
        ),
    ]



