# Generated by Django 3.2 on 2023-02-11 10:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0003_alter_comment_reply_datetime'),
    ]

    operations = [
        migrations.AddField(
            model_name='quote',
            name='offensive_votes',
            field=models.IntegerField(default=0),
        ),
    ]
