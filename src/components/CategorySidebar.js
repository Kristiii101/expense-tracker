import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { CATEGORIES } from '../config/constants';
import '../styles/CategoryManager.css';

const CategorySidebar = ({ currentCategory }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const categoriesRef = doc(db, 'settings', 'categories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      if (categoriesDoc.exists()) {
        setCategories(categoriesDoc.data().list);
      } else {
        // Initialize with default categories
        const defaultCategories = [
          ...CATEGORIES,
        ];
        await setDoc(categoriesRef, { list: defaultCategories });
        setCategories(defaultCategories);
      }
    };

    loadCategories();
  }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    
    const categoriesRef = doc(db, 'settings', 'categories');
    await updateDoc(categoriesRef, {
      list: arrayUnion(newCategory)
    });
    
    setCategories(prev => [...prev, newCategory]);
    setNewCategory('');
    setIsAdding(false);
  };

  const deleteCategory = async (categoryToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${categoryToDelete}?`)) {
      const categoriesRef = doc(db, 'settings', 'categories');
      await updateDoc(categoriesRef, {
        list: arrayRemove(categoryToDelete)
      });
      setCategories(prev => prev.filter(c => c !== categoryToDelete));
    }
  };

  return (
    <div className="category-sidebar">
      <h3>Categories</h3>
      <ul>
        {categories.map(category => (
          <li key={category} className={category === currentCategory ? 'active' : ''}>
            <Link to={`/category/${encodeURIComponent(category)}`}>
              {category}
            </Link>
            <button 
              className="delete-category-btn"
              onClick={(e) => {
                e.preventDefault();
                deleteCategory(category);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      
      {isAdding ? (
        <div className="add-category-form">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
          />
          <button onClick={addCategory}>Add</button>
          <button onClick={() => setIsAdding(false)}>Cancel</button>
        </div>
      ) : (
        <button 
          className="add-category-btn"
          onClick={() => setIsAdding(true)}
        >
          + Add Category
        </button>
      )}
    </div>
  );
};

export default CategorySidebar;
