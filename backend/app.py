from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

# --- 1. App Configuration ---
app = Flask(__name__)
# Configure a local SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database and CORS
db = SQLAlchemy(app)
CORS(app) # Enables CORS for all routes

# --- 2. Database Models & Association Tables ---

# Association table for the many-to-many relationship between Posts and Tags
post_tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

# Association table for the many-to-many relationship between Posts and Categories
post_categories = db.Table('post_categories',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

class Tag(db.Model):
    """
    Represents a Tag that can be associated with multiple posts.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f"Tag('{self.name}')"

class Category(db.Model):
    """
    Represents a Category that can be associated with multiple posts.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f"Category('{self.name}')"

class File(db.Model):
    """
    Represents a file uploaded for a specific post.
    """
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    file_url = db.Column(db.String(200), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_url': self.file_url,
            'post_id': self.post_id
        }

class Comment(db.Model):
    """
    Represents a Comment on a specific post.
    """
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'author': self.author,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'post_id': self.post_id
        }

class Post(db.Model):
    """
    Represents a blog post, with support for different 'Feathers'.
    """
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    feather_type = db.Column(db.String(50), nullable=False, default='Text')
    likes_count = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    
    # Fields for the Rights Module
    attribution = db.Column(db.String(200), nullable=True)
    copyright_info = db.Column(db.String(200), nullable=True)

    # Fields for other Feathers (e.g., Link, Photo)
    link_url = db.Column(db.String(200), nullable=True)
    media_url = db.Column(db.String(200), nullable=True)
    
    # Relationships
    tags = db.relationship('Tag', secondary=post_tags, lazy='subquery',
                           backref=db.backref('posts', lazy=True))
    categories = db.relationship('Category', secondary=post_categories, lazy='subquery',
                                 backref=db.backref('posts', lazy=True))
    files = db.relationship('File', backref='post', lazy=True)
    comments = db.relationship('Comment', backref='post', lazy=True)

    def __repr__(self):
        return f"Post('{self.title}', '{self.feather_type}')"
    
    def to_dict(self):
        """Converts a Post object to a dictionary for JSON serialization."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'feather_type': self.feather_type,
            'link_url': self.link_url,
            'media_url': self.media_url,
            'likes_count': self.likes_count,
            'views_count': self.views_count,
            'attribution': self.attribution,
            'copyright_info': self.copyright_info,
            'tags': [tag.name for tag in self.tags],
            'categories': [category.name for category in self.categories],
            'files': [file.to_dict() for file in self.files],
            'comments': [comment.to_dict() for comment in self.comments]
        }

# This function creates the database tables if they don't exist
with app.app_context():
    db.create_all()

# --- 3. API Endpoints (Routes) ---

@app.route('/api/posts', methods=['POST'])
def create_post():
    """Endpoint to create a new blog post."""
    data = request.get_json()
    
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'Missing title or content'}), 400

    new_post = Post(
        title=data['title'],
        content=data['content'],
        feather_type=data.get('feather_type', 'Text'),
        link_url=data.get('link_url'),
        media_url=data.get('media_url'),
        attribution=data.get('attribution'),
        copyright_info=data.get('copyright_info')
    )
    
    # Handle tags from the request
    if 'tags' in data and isinstance(data['tags'], list):
        for tag_name in data['tags']:
            tag = Tag.query.filter_by(name=tag_name.lower()).first()
            if not tag:
                tag = Tag(name=tag_name.lower())
                db.session.add(tag)
            new_post.tags.append(tag)
            
    # Handle categories from the request
    if 'categories' in data and isinstance(data['categories'], list):
        for category_name in data['categories']:
            category = Category.query.filter_by(name=category_name.lower()).first()
            if not category:
                category = Category(name=category_name.lower())
                db.session.add(category)
            new_post.categories.append(category)

    db.session.add(new_post)
    db.session.commit()
    
    return jsonify(new_post.to_dict()), 201

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Endpoint to get a list of all posts."""
    posts = Post.query.all()
    posts_list = [post.to_dict() for post in posts]
    return jsonify(posts_list)

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Endpoint to get a single post by its ID."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    return jsonify(post.to_dict())

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    """Endpoint to increment the likes count for a specific post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404

    post.likes_count += 1
    db.session.commit()
    
    return jsonify(post.to_dict()), 200

@app.route('/api/posts/<int:post_id>/view', methods=['POST'])
def view_post(post_id):
    """Endpoint to increment the views count for a specific post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404

    post.views_count += 1
    db.session.commit()
    
    return jsonify(post.to_dict()), 200

@app.route('/api/posts/<int:post_id>/upload', methods=['POST'])
def upload_file(post_id):
    """
    Endpoint to upload file metadata for a specific post.
    Note: For a hackathon, we are not handling actual file storage.
    We just store the filename and URL.
    """
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
        
    data = request.get_json()
    if not data or 'filename' not in data or 'file_url' not in data:
        return jsonify({'error': 'Missing filename or file_url'}), 400
        
    new_file = File(
        filename=data['filename'],
        file_url=data['file_url'],
        post_id=post.id
    )
    
    db.session.add(new_file)
    db.session.commit()
    
    return jsonify(new_file.to_dict()), 201

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    """Endpoint to add a new comment to a specific post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404

    data = request.get_json()
    if not data or 'content' not in data or 'author' not in data:
        return jsonify({'error': 'Missing comment content or author'}), 400

    new_comment = Comment(
        content=data['content'],
        author=data['author'],
        post_id=post.id
    )
    
    db.session.add(new_comment)
    db.session.commit()
    
    return jsonify(new_comment.to_dict()), 201
    
@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """Endpoint to get all comments for a specific post."""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
        
    comments = [comment.to_dict() for comment in post.comments]
    return jsonify(comments)

@app.route('/api/tags', methods=['GET'])
def get_all_tags():
    """Endpoint to get a list of all unique tags."""
    tags = Tag.query.all()
    tags_list = [tag.name for tag in tags]
    return jsonify(tags_list)

@app.route('/api/tags/<tag_name>/posts', methods=['GET'])
def get_posts_by_tag(tag_name):
    """Endpoint to get all posts associated with a specific tag."""
    tag = Tag.query.filter_by(name=tag_name.lower()).first()
    if not tag:
        return jsonify({'message': 'Tag not found'}), 404
        
    posts = tag.posts
    posts_list = [post.to_dict() for post in posts]
    
    return jsonify(posts_list)

@app.route('/api/categories', methods=['GET'])
def get_all_categories():
    """Endpoint to get a list of all unique categories."""
    categories = Category.query.all()
    categories_list = [category.name for category in categories]
    return jsonify(categories_list)

@app.route('/api/categories/<category_name>/posts', methods=['GET'])
def get_posts_by_category(category_name):
    """Endpoint to get all posts associated with a specific category."""
    category = Category.query.filter_by(name=category_name.lower()).first()
    if not category:
        return jsonify({'message': 'Category not found'}), 404
        
    posts = category.posts
    posts_list = [post.to_dict() for post in posts]
    
    return jsonify(posts_list)

# --- 4. Run the Application ---
if __name__ == '__main__':
    app.run(debug=True)
