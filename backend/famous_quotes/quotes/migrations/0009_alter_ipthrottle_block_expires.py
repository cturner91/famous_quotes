# Generated by Django 3.2 on 2023-02-12 16:22

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0008_ipthrottle_block_expires'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ipthrottle',
            name='block_expires',
            field=models.DateTimeField(blank=True, default=datetime.datetime(2023, 2, 13, 16, 22, 18, 675778, tzinfo=utc), null=True),
        ),
    ]