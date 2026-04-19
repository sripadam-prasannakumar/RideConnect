import re

def sanitize_group_name(name):
    """
    Django Channels group names must be valid unicode strings with length < 100
    containing only ASCII alphanumerics, hyphens, underscores, or periods.
    """
    if not name:
        return "default_group"
    
    # Cast to string and replace invalid characters
    sanitized = re.sub(r'[^a-zA-Z0-9\-\_\.]', '_', str(name))
    
    # Truncate to 100 characters if necessary
    return sanitized[:99]
