from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('api', '0002_waitlist')]
    operations = [
        migrations.AlterField(
            model_name='building',
            name='category',
            field=models.CharField(choices=[('faculty', 'Faculty'), ('department', 'Department'), ('library', 'Library'), ('lab', 'Lab'), ('admin', 'Admin'), ('facility', 'Facility'), ('hostel', 'Hostel')], db_index=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='building',
            name='name',
            field=models.CharField(db_index=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='event',
            name='category',
            field=models.CharField(choices=[('academic', 'Academic'), ('social', 'Social'), ('sports', 'Sports'), ('career', 'Career')], db_index=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='lostitem',
            name='status',
            field=models.CharField(choices=[('lost', 'Lost'), ('found', 'Found')], db_index=True, max_length=10),
        ),
        migrations.AlterField(
            model_name='lostitem',
            name='reported_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
    ]
