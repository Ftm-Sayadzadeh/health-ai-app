from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Plan


@receiver(post_delete, sender=Plan)
def delete_plan_attachment(sender, instance, **kwargs):
    if instance.attachment:
        instance.attachment.delete(save=False)
