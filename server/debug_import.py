try:
    import skillshare_data_models
    print(f"skillshare_data_models loaded from: {skillshare_data_models.__file__}")
    print(f"Contents: {dir(skillshare_data_models)}")
    from skillshare_data_models import Project
    print("Project class imported successfully")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
