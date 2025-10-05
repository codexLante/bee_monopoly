"""
Simple Monopoly Game Logic
This file contains all the rules for how the game works
"""

# Board space definitions - what happens when you land on each space
BOARD_SPACES = {
    0: {"name": "Go", "type": "go"},
    1: {"name": "Mediterranean Avenue", "type": "property", "price": 60, "rent": 6, "color": "brown"},
    2: {"name": "Community Chest", "type": "community_chest"},
    3: {"name": "Baltic Avenue", "type": "property", "price": 60, "rent": 6, "color": "brown"},
    4: {"name": "Income Tax", "type": "tax", "amount": 200},
    5: {"name": "Reading Railroad", "type": "railroad", "price": 200, "rent": 25},
    6: {"name": "Oriental Avenue", "type": "property", "price": 100, "rent": 10, "color": "light_blue"},
    7: {"name": "Chance", "type": "chance"},
    8: {"name": "Vermont Avenue", "type": "property", "price": 100, "rent": 10, "color": "light_blue"},
    9: {"name": "Connecticut Avenue", "type": "property", "price": 120, "rent": 12, "color": "light_blue"},
    10: {"name": "Jail", "type": "jail"},
    11: {"name": "St. Charles Place", "type": "property", "price": 140, "rent": 14, "color": "pink"},
    12: {"name": "Electric Company", "type": "utility", "price": 150},
    13: {"name": "States Avenue", "type": "property", "price": 140, "rent": 14, "color": "pink"},
    14: {"name": "Virginia Avenue", "type": "property", "price": 160, "rent": 16, "color": "pink"},
    15: {"name": "Pennsylvania Railroad", "type": "railroad", "price": 200, "rent": 25},
    16: {"name": "St. James Place", "type": "property", "price": 180, "rent": 18, "color": "orange"},
    17: {"name": "Community Chest", "type": "community_chest"},
    18: {"name": "Tennessee Avenue", "type": "property", "price": 180, "rent": 18, "color": "orange"},
    19: {"name": "New York Avenue", "type": "property", "price": 200, "rent": 20, "color": "orange"},
    20: {"name": "Free Parking", "type": "free_parking"},
    21: {"name": "Kentucky Avenue", "type": "property", "price": 220, "rent": 22, "color": "red"},
    22: {"name": "Chance", "type": "chance"},
    23: {"name": "Indiana Avenue", "type": "property", "price": 220, "rent": 22, "color": "red"},
    24: {"name": "Illinois Avenue", "type": "property", "price": 240, "rent": 24, "color": "red"},
    25: {"name": "B&O Railroad", "type": "railroad", "price": 200, "rent": 25},
    26: {"name": "Atlantic Avenue", "type": "property", "price": 260, "rent": 26, "color": "yellow"},
    27: {"name": "Ventnor Avenue", "type": "property", "price": 260, "rent": 26, "color": "yellow"},
    28: {"name": "Water Works", "type": "utility", "price": 150},
    29: {"name": "Marvin Gardens", "type": "property", "price": 280, "rent": 28, "color": "yellow"},
    30: {"name": "Go to Jail", "type": "go_to_jail"},
    31: {"name": "Pacific Avenue", "type": "property", "price": 300, "rent": 30, "color": "green"},
    32: {"name": "North Carolina Avenue", "type": "property", "price": 300, "rent": 30, "color": "green"},
    33: {"name": "Community Chest", "type": "community_chest"},
    34: {"name": "Pennsylvania Avenue", "type": "property", "price": 320, "rent": 32, "color": "green"},
    35: {"name": "Short Line", "type": "railroad", "price": 200, "rent": 25},
    36: {"name": "Chance", "type": "chance"},
    37: {"name": "Park Place", "type": "property", "price": 350, "rent": 35, "color": "dark_blue"},
    38: {"name": "Luxury Tax", "type": "tax", "amount": 100},
    39: {"name": "Boardwalk", "type": "property", "price": 400, "rent": 50, "color": "dark_blue"}
}


def handle_landing(player, position, game_state):
    """
    Handles what happens when a player lands on a space.
    Returns: (messages, actions)
    - messages: list of strings describing what happened
    - actions: dict with actions the player can take (e.g., can_buy, bankrupt)
    """
    space = BOARD_SPACES.get(position)
    if not space:
        return (["Landed on unknown space"], {})

    messages = [f"{player['name']} landed on {space['name']}"]
    actions = {}

    space_type = space.get('type')

    # Ensure board entry exists
    board = game_state['board']
    if space_type in ['property', 'railroad', 'utility']:
        property_data = board.get(space['name'])
        if not property_data:
            property_data = {
                'position': position,
                'price': space['price'],
                'owner': None,
                'houses': 0,
                'type': space_type
            }
            board[space['name']] = property_data

        if property_data['owner'] is None:
            if player['money'] >= space['price']:
                actions['can_buy'] = {
                    'property': space['name'],
                    'price': space['price']
                }
                messages.append(f"You can buy {space['name']} for ${space['price']}")
            else:
                messages.append(f"{space['name']} costs ${space['price']} but you only have ${player['money']}")
        elif property_data['owner'] != player['id']:
            rent = calculate_rent(space, property_data, game_state)
            owner = next((p for p in game_state['players'] if p['id'] == property_data['owner']), None)
            if owner:
                if player['money'] >= rent:
                    player['money'] -= rent
                    owner['money'] += rent
                    messages.append(f"Paid ${rent} rent to {owner['name']}")
                else:
                    messages.append(f"Cannot afford ${rent} rent! Bankrupt!")
                    actions['bankrupt'] = True

    elif space_type == 'go':
        player['money'] += 200
        messages.append("Collect $200 for landing on Go!")

    elif space_type == 'tax':
        tax_amount = space['amount']
        if player['money'] >= tax_amount:
            player['money'] -= tax_amount
            messages.append(f"Paid ${tax_amount} in taxes")
        else:
            messages.append(f"Cannot afford ${tax_amount} tax! Bankrupt!")
            actions['bankrupt'] = True

    elif space_type == 'go_to_jail':
        player['position'] = 10  # Jail position
        player['in_jail'] = True
        player['jail_turns'] = 0
        messages.append("Go directly to Jail! Do not pass Go, do not collect $200")

    elif space_type == 'jail':
        messages.append("Just visiting jail")

    elif space_type == 'free_parking':
        messages.append("Resting at Free Parking")

    elif space_type in ['chance', 'community_chest']:
        bonus = 50
        player['money'] += bonus
        messages.append(f"Drew a card! Received ${bonus}")

    return messages, actions

def calculate_rent(space, property_data, game_state):
    """
    Calculates how much rent to charge
    Rent increases with houses/hotels
    """
    base_rent = space.get('rent', 0)
    houses = property_data.get('houses', 0)
    
    # Each house doubles the rent
    if houses == 0:
        return base_rent
    elif houses == 1:
        return base_rent * 2
    elif houses == 2:
        return base_rent * 4
    elif houses == 3:
        return base_rent * 6
    elif houses == 4:
        return base_rent * 8
    else:  # Hotel (5 houses)
        return base_rent * 10


def can_build_house(player, property_name, game_state):
    """
    Checks if a player can build a house on a property
    Returns: (can_build, reason)
    """
    property_data = game_state['board'].get(property_name)
    
    if not property_data:
        return (False, "Property doesn't exist")
    
    if property_data.get('owner') != player['id']:
        return (False, "You don't own this property")
    
    if property_data.get('houses', 0) >= 5:
        return (False, "Already has a hotel")
    
    house_cost = 100
    if player['money'] < house_cost:
        return (False, f"Need ${house_cost} to build")
    
    return (True, "Can build")


def handle_jail(player, dice_roll):
    """
    Handles jail logic
    Returns: (can_move, messages)
    """
    messages = []
    
    if not player.get('in_jail'):
        return (True, messages)
    
    # Check if rolled doubles
    if dice_roll[0] == dice_roll[1]:
        player['in_jail'] = False
        player['jail_turns'] = 0
        messages.append(f"{player['name']} rolled doubles and got out of jail!")
        return (True, messages)
    
    # Increment jail turns
    player['jail_turns'] = player.get('jail_turns', 0) + 1
    
    # After 3 turns, must pay to get out
    if player['jail_turns'] >= 3:
        if player['money'] >= 50:
            player['money'] -= 50
            player['in_jail'] = False
            player['jail_turns'] = 0
            messages.append(f"{player['name']} paid $50 to get out of jail")
            return (True, messages)
        else:
            messages.append(f"{player['name']} can't afford to leave jail! Bankrupt!")
            return (False, messages)
    
    messages.append(f"{player['name']} is in jail (turn {player['jail_turns']}/3)")
    return (False, messages)


def check_winner(game_state):
    """
    Checks if there's a winner (only one player left with money)
    Returns: winner player or None
    """
    active_players = [p for p in game_state['players'] if p['money'] > 0]
    
    if len(active_players) == 1:
        return active_players[0]
    
    return None
