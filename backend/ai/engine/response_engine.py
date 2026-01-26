import json
import os

# Load space objects data
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "space_objects.json")

def load_space_data():
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


space_data = load_space_data()


def find_object_by_name(question):
    """
    Simple keyword matching to find space object
    """
    question_lower = question.lower()

    for obj in space_data:
        name = obj["name"].lower()
        if name in question_lower:
            return obj

    return None


def generate_answer(question):
    """
    Main AI response logic
    """

    matched_object = find_object_by_name(question)

    if not matched_object:
        return "Sorry, I couldn't find information about that space object."

    # Format response nicely
    answer = f"""
Name: {matched_object['name']}
Type: {matched_object['type']}
Distance: {matched_object['distance']}

Key Features:
"""

    for feature in matched_object["features"]:
        answer += f"- {feature}\n"

    answer += f"\nDiscovery: {matched_object['discovery']}"

    return answer.strip()

# Example usage
if __name__ == "__main__":
    question = "Tell me about Andromeda Galaxy"
    print(generate_answer(question))
