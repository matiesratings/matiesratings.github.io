import random

def generate_random_number(min_val: int, max_val: int, excluded_numbers: list[int] = None) -> int:
    """
    Generates a random integer between min_val and max_val (inclusive),
    excluding any numbers present in the excluded_numbers list.

    Args:
        min_val: The minimum value of the range (inclusive).
        max_val: The maximum value of the range (inclusive).
        excluded_numbers: A list of integers to be excluded from the result.
                          Defaults to an empty list if not provided.

    Returns:
        A randomly chosen integer from the valid range.

    Raises:
        ValueError: If the range is invalid or if all numbers in the
                    specified range are excluded.
    """
    if min_val > max_val:
        raise ValueError("min_val cannot be greater than max_val.")

    # Initialize excluded_numbers to an empty list if it's None
    if excluded_numbers is None:
        excluded_numbers = []

    # Create a list of all valid numbers in the range
    valid_numbers = [num for num in range(min_val, max_val + 1) if num not in excluded_numbers]

    # Check if any valid numbers exist
    if not valid_numbers:
        raise ValueError("No valid numbers can be generated within the given constraints.")

    # Return a random choice from the list of valid numbers
    return random.choice(valid_numbers)

# --- Example Usage ---

if __name__ == "__main__":
    # excluded = [11,14,12,10,9,16,12,13]
    # excluded = [11,14,12,10,14,11,10,15]
    excluded = [10,11,12]
    min = 9
    max = 13
    try:
        rand_num = generate_random_number(min, max, excluded)
        print(f"Generated a random number between {min} and {max}, excluding {excluded}: {rand_num}")
    except ValueError as e:
        print(f"Error: {e}")
