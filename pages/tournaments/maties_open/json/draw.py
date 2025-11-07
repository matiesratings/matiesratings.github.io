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
    rand_num = random.choice(valid_numbers)
    print(f"Generated a random number between {min_val} and {max_val}, excluding {excluded_numbers}: {rand_num}")

    return 

# --- Example Usage ---

if __name__ == "__main__":
    # Round of 32 
    top = [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 32]
    bottom = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23, 26, 27, 30, 31]
    print('Bottom' if 1 in bottom else 'Top')

    drawn_seeds = [10]    

    excluded = drawn_seeds + []
    # excluded = drawn_seeds + bottom
    excluded = drawn_seeds + top

    min = 1
    max = 2

    rand_num = generate_random_number(min, max, excluded)


