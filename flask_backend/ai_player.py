import random

class MonopolyAI:
    """Simple AI logic for computer players in Monopoly"""
    
    @staticmethod
    def should_buy_property(player, property_data):
        """Decide if AI should buy a property"""
        price = property_data.get('price', 0)
        
        # Don't buy if can't afford it with buffer
        if player['money'] < price + 500:
            return False
        
        # Buy if price is reasonable relative to money
        if price < player['money'] * 0.4:
            return True
        
        # 70% chance to buy if affordable
        return random.random() < 0.7
    
    @staticmethod
    def should_build(player, property_data, board):
        """Decide if AI should build on a property"""
        current_houses = property_data.get('houses', 0)
        
        # Don't build if already has hotel
        if current_houses >= 5:
            return False
        
        # Calculate build cost
        build_cost = 100 if current_houses < 4 else 500
        
        # Don't build if can't afford with buffer
        if player['money'] < build_cost + 800:
            return False
        
        # Count owned properties
        owned_count = sum(1 for prop in board.values() 
                         if prop.get('owner') == player['id'])
        
        # More likely to build if owns multiple properties
        if owned_count >= 3:
            return random.random() < 0.6
        
        return random.random() < 0.3
    
    @staticmethod
    def choose_property_to_build(player, board):
        """Choose which property to build on"""
        owned_properties = [
            (name, prop) for name, prop in board.items()
            if prop.get('owner') == player['id'] and prop.get('houses', 0) < 5
        ]
        
        if not owned_properties:
            return None
        
        # Prefer properties with fewer houses (build evenly)
        property_with_fewest_houses = owned_properties[0]
        for prop_name, prop_data in owned_properties:
            current_houses = prop_data.get('houses', 0)
            fewest_houses = property_with_fewest_houses[1].get('houses', 0)
            if current_houses < fewest_houses:
                property_with_fewest_houses = (prop_name, prop_data)
        
        return property_with_fewest_houses[0]
